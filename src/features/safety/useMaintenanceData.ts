import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { MaintenanceLog } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useMaintenanceData() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.maintenance_logs.find().$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as MaintenanceLog).filter(d => !d.is_deleted);
            const sortedData = rawData.sort((a, b) => new Date(b.date_logged || 0).getTime() - new Date(a.date_logged || 0).getTime());
            setLogs(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load maintenance data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const addLog = async (log: Omit<MaintenanceLog, 'id'>) => {
    const db = await bootCoreDatabase();
    const newLog: MaintenanceLog = {
      ...log,
      id: uuidv4(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as MaintenanceLog;
    await db.maintenance_logs.upsert(newLog);
  };

  const updateLog = async (log: MaintenanceLog) => {
    const db = await bootCoreDatabase();
    await db.maintenance_logs.upsert({
      ...log,
      updated_at: new Date().toISOString()
    });
  };

  const deleteLog = async (id: string) => {
    const db = await bootCoreDatabase();
    const logDoc = await db.maintenance_logs.findOne(id).exec();
    if (logDoc) {
      const log = logDoc.toJSON();
      await db.maintenance_logs.upsert({
        ...log,
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    logs,
    isLoading,
    addLog,
    updateLog,
    deleteLog
  };
}
