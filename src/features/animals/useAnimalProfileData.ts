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
      setTimeout(() => setIsLoading(false), 0);
      return;
    }

    let isMounted = true;
    let subs: any[] = [];

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        subs = [
          // 1. Animal Details
          db.animals.find().$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as Animal);
              const foundAnimal = raw.find(a => a.record_type === 'animals' && a.id === animalId && !a.is_deleted);
              setAnimal(foundAnimal || null);
            }
          }),

          // 2. Husbandry / Daily Logs
          db.daily_records.find().$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as LogEntry);
              const animalLogs = raw.filter(l => l.record_type === 'daily_logs_v2' && l.animal_id === animalId && !l.is_deleted);
              
              // 🚨 CRITICAL FIX: Robust Date Fallback Sort (Newest First)
              const sortedLogs = animalLogs.sort((a, b) => {
                const timeA = new Date(a.log_date || a.created_at || 0).getTime();
                const timeB = new Date(b.log_date || b.created_at || 0).getTime();
                return timeB - timeA; 
              });
              setDailyLogs(sortedLogs);
            }
          }),

          // 3. Medical Logs
          db.clinical_records.find().$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as ClinicalNote);
              const animalMedLogs = raw.filter(m => m.record_type === 'medical_logs' && m.animal_id === animalId && !m.is_deleted);
              
              const sortedMed = animalMedLogs.sort((a, b) => {
                const timeA = new Date(a.date || a.updated_at || 0).getTime();
                const timeB = new Date(b.date || b.updated_at || 0).getTime();
                return timeB - timeA;
              });
              setMedicalLogs(sortedMed);
            }
          }),

          // 4. Tasks
          db.tasks.find().$.subscribe(docs => {
            if (isMounted) {
              const raw = docs.map(d => d.toJSON() as Task);
              const animalTasks = raw.filter(t => t.record_type === 'tasks' && t.animal_id === animalId && !t.is_deleted);
              
              const sortedTasks = animalTasks.sort((a, b) => {
                const timeA = new Date(a.due_date || a.updated_at || 0).getTime();
                const timeB = new Date(b.due_date || b.updated_at || 0).getTime();
                return timeB - timeA;
              });
              setTasks(sortedTasks);
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
