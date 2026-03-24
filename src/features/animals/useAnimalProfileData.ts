import { useState, useEffect } from 'react';
import { coreDB, bootCoreDatabase } from '../../lib/DatabaseCore';
import { Animal, LogEntry, Task } from '../../types';

export function useAnimalProfileData(animalId: string) {
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subs: { unsubscribe: () => void }[] = [];

    const loadData = async () => {
      if (!animalId) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const db = coreDB || await bootCoreDatabase();
        if (!isMounted) return;

        const animalSub = db.animals.findOne(animalId).$.subscribe(doc => {
          if (isMounted) {
            if (doc) {
              setAnimal(doc.toJSON() as Animal);
            } else {
              setAnimal(null);
            }
            setIsLoading(false);
          }
        });

        const logsSub = db.daily_records.find({
          selector: { animal_id: animalId }
        }).$.subscribe(docs => {
          if (isMounted) {
            setLogs(docs.map(d => d.toJSON() as LogEntry));
          }
        });

        const tasksSub = db.tasks.find({
          selector: { animal_id: animalId }
        }).$.subscribe(docs => {
          if (isMounted) {
            setTasks(docs.map(d => d.toJSON() as Task));
          }
        });

        subs = [animalSub, logsSub, tasksSub];
      } catch (err) {
        console.error('Failed to load animal profile data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      subs.forEach(sub => sub.unsubscribe());
    };
  }, [animalId]);

  const archiveAnimal = async (reason: string, type: NonNullable<Animal['archive_type']>) => {
    const db = coreDB || await bootCoreDatabase();
    if (!animal) return;
    const doc = await db.animals.findOne(animal.id).exec();
    if (doc) {
      await doc.patch({
        record_type: 'archived_animals',
        archived: true,
        archive_reason: reason,
        archive_type: type,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    animal,
    logs,
    tasks,
    orgProfile: { name: 'Kent Owl Academy', logo_url: '' },
    allAnimals: [],
    isLoading,
    archiveAnimal
  };
}
