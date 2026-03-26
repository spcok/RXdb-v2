import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { Animal, Task } from '../../types';

export function useFeedingScheduleData() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subs: { unsubscribe: () => void }[] = [];

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        const animalsSub = db.animals.find().$.subscribe(docs => {
          if (isMounted) {
            setAnimals(docs.map(d => d.toJSON() as Animal).filter(d => !d.is_deleted));
          }
        });

        const tasksSub = db.tasks.find().$.subscribe(docs => {
          if (isMounted) {
            setTasks(docs.map(d => d.toJSON() as Task).filter(d => !d.is_deleted));
            setIsLoading(false);
          }
        });

        subs = [animalsSub, tasksSub];
      } catch (err) {
        console.error('Failed to load feeding schedule data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      subs.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const addTasks = async (newTasks: Task[]) => {
    const db = await bootCoreDatabase();
    for (const task of newTasks) {
      await db.tasks.upsert({
        ...task,
        updated_at: new Date().toISOString(),
        is_deleted: false
      });
    }
  };

  const deleteTask = async (id: string) => {
    const db = await bootCoreDatabase();
    const taskDoc = await db.tasks.findOne(id).exec();
    if (taskDoc) {
      const task = taskDoc.toJSON();
      await db.tasks.upsert({
        ...task,
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    animals,
    tasks,
    isLoading,
    addTasks,
    deleteTask
  };
}
