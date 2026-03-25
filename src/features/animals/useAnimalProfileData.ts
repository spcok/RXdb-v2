import { useState, useEffect } from 'react';
import { coreDB, bootCoreDatabase } from '../../lib/DatabaseCore';
import { Animal, ClinicalNote, LogEntry, Task } from '../../types';

export function useAnimalProfileData(animalId: string | undefined) {
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [dailyLogs, setDailyLogs] = useState<LogEntry[]>([]);
  const [medicalLogs, setMedicalLogs] = useState<ClinicalNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!animalId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let subs: any[] = [];

    const loadData = async () => {
      try {
        const db = coreDB || await bootCoreDatabase();
        if (!isMounted) return;

        subs = [
          // 1. Animal Details
          db.animals.find({
            selector: { record_type: 'animals' }
          }).$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as Animal);
              const foundAnimal = raw.find(a => a.id === animalId && !a.is_deleted);
              setAnimal(foundAnimal || null);
            }
          }),

          // 2. Husbandry / Daily Logs (Bulletproof Memory Filter)
          db.daily_records.find({
            selector: { record_type: 'daily_logs_v2' }
          }).$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as LogEntry);
              // Filter by animal ID and ensure it's not deleted
              const animalLogs = raw.filter(l => l.animal_id === animalId && !l.is_deleted);
              // Sort by date descending
              setDailyLogs(animalLogs.sort((a, b) => new Date(b.log_date || 0).getTime() - new Date(a.log_date || 0).getTime()));
            }
          }),

          // 3. Medical Logs
          db.clinical_records.find({
            selector: { record_type: 'medical_logs' }
          }).$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as ClinicalNote);
              const animalMedLogs = raw.filter(m => m.animal_id === animalId && !m.is_deleted);
              setMedicalLogs(animalMedLogs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
            }
          }),

          // 4. Tasks
          db.tasks.find({
            selector: { record_type: 'tasks' }
          }).$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as Task);
              const animalTasks = raw.filter(t => t.animal_id === animalId && !t.is_deleted);
              setTasks(animalTasks.sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()));
            }
          })
        ];
        
        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("Failed to load animal profile data:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      subs.forEach(sub => sub?.unsubscribe?.());
    };
  }, [animalId]);

  return { animal, dailyLogs, medicalLogs, tasks, isLoading };
}