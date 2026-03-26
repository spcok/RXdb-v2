import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { FirstAidLog } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useFirstAidData() {
  const [logs, setLogs] = useState<FirstAidLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.first_aid_logs.find().$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as FirstAidLog).filter(d => !d.is_deleted);
            const sortedData = rawData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            setLogs(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load first aid data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const addFirstAid = async (log: Omit<FirstAidLog, 'id'>) => {
    const db = await bootCoreDatabase();
    const newLog: FirstAidLog = {
      ...log,
      id: uuidv4(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as FirstAidLog;
    await db.first_aid_logs.upsert(newLog);
  };

  const deleteFirstAid = async (id: string) => {
    const db = await bootCoreDatabase();
    const logDoc = await db.first_aid_logs.findOne(id).exec();
    if (logDoc) {
      const log = logDoc.toJSON();
      await db.first_aid_logs.upsert({
        ...log,
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    logs,
    isLoading,
    addFirstAid,
    deleteFirstAid
  };
}
