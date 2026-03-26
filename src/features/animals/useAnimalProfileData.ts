import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
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
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        subs = [
          // 1. Animal Details (No Selector)
          db.animals.find().$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as Animal);
              const foundAnimal = raw.find(a => a.record_type === 'animals' && a.id === animalId && !a.is_deleted);
              setAnimal(foundAnimal || null);
            }
          }),

          // 2. Husbandry / Daily Logs (No Selector)
          db.daily_records.find().$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as LogEntry);
              console.log(`🕵️ [Profile Logs] Total daily_records: ${raw.length}`);
              
              const animalLogs = raw.filter(l => 
                l.record_type === 'daily_logs_v2' && 
                l.animal_id === animalId && 
                !l.is_deleted
              );
              
              console.log(`🕵️ [Profile Logs] Matched to this animal: ${animalLogs.length}`);
              
              setDailyLogs(animalLogs.sort((a, b) => new Date(b.log_date || 0).getTime() - new Date(a.log_date || 0).getTime()));
            }
          }),

          // 3. Medical Logs (No Selector)
          db.clinical_records.find().$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as ClinicalNote);
              const animalMedLogs = raw.filter(m => m.record_type === 'medical_logs' && m.animal_id === animalId && !m.is_deleted);
              setMedicalLogs(animalMedLogs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
            }
          }),

          // 4. Tasks (No Selector)
          db.tasks.find().$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as Task);
              const animalTasks = raw.filter(t => t.record_type === 'tasks' && t.animal_id === animalId && !t.is_deleted);
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