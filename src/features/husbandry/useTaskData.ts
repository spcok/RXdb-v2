import { useState, useMemo, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { Task, User, UserRole, Animal } from '../../types';

const mockUsers: User[] = [
  { id: 'u1', email: 'john@example.com', name: 'John Doe', initials: 'JD', role: UserRole.VOLUNTEER },
  { id: 'u2', email: 'jane@example.com', name: 'Jane Smith', initials: 'JS', role: UserRole.ADMIN }
];

export const useTaskData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subs: { unsubscribe: () => void }[] = [];

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        subs = [
          db.tasks.find().$.subscribe(docs => {
            if (isMounted) {
              const rawData = docs.map(d => d.toJSON() as Task).filter(d => !d.is_deleted);
              // Sort in memory by date
              const sortedData = rawData.sort((a, b) => 
                new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()
              );
              setTasks(sortedData);
            }
          }),

          db.animals.find().$.subscribe(docs => {
            if (isMounted) {
              setAnimals(docs.map(d => d.toJSON() as Animal).filter(d => !d.is_deleted));
              setIsLoading(false);
            }
          })
        ];
      } catch (err) {
        console.error('Failed to load task data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      subs.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const [filter, setFilter] = useState<'assigned' | 'pending' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const currentUser = mockUsers[0];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'completed' && !task.completed) return false;
      if (filter === 'pending' && task.completed) return false;
      if (filter === 'assigned' && (task.assigned_to !== currentUser.id || task.completed)) return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const animalName = animals.find(a => a.id === task.animal_id)?.name.toLowerCase() || '';
        return (
          task.title.toLowerCase().includes(searchLower) ||
          animalName.includes(searchLower)
        );
      }
      return true;
    });
  }, [tasks, filter, searchTerm, currentUser.id, animals]);

  const addTask = async (newTask: Omit<Task, 'id'>) => {
    const db = await bootCoreDatabase();
    const taskWithId = { ...newTask, id: crypto.randomUUID(), updated_at: new Date().toISOString(), is_deleted: false } as Task;
    await db.tasks.upsert(taskWithId);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const db = await bootCoreDatabase();
    const taskDoc = await db.tasks.findOne(id).exec();
    if (taskDoc) await db.tasks.upsert({ ...taskDoc.toJSON(), ...updates, updated_at: new Date().toISOString() });
  };

  const deleteTask = async (id: string) => {
    const db = await bootCoreDatabase();
    const taskDoc = await db.tasks.findOne(id).exec();
    if (taskDoc) await db.tasks.upsert({ ...taskDoc.toJSON(), is_deleted: true, updated_at: new Date().toISOString() });
  };

  const toggleTaskCompletion = async (task: Task) => {
    const db = await bootCoreDatabase();
    await db.tasks.upsert({ ...task, completed: !task.completed, updated_at: new Date().toISOString() });
  };

  return { tasks: filteredTasks, animals, users: mockUsers, isLoading, filter, setFilter, searchTerm, setSearchTerm, addTask, updateTask, deleteTask, toggleTaskCompletion, currentUser };
};