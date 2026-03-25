import { useCallback, useMemo, useState, useEffect } from 'react';
import { LogEntry, LogType } from '../../types';
import { coreDB, bootCoreDatabase } from '../../lib/DatabaseCore';
import { useAnimalsData } from '../animals/useAnimalsData';

export const useDailyLogData = (viewDate: string, activeCategory: string) => {
  const { animals, isLoading: animalsLoading } = useAnimalsData();
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: any;

    const loadLogs = async () => {
      try {
        const db = coreDB || await bootCoreDatabase();
        if (!isMounted) return;

        // 🚨 NUCLEAR OPTION: No selectors at all. Fetch everything and filter in memory.
        sub = db.daily_records.find().$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as LogEntry);
            
            console.log(`🕵️ [Daily Logs] Total records in local bucket: ${rawData.length}`);

            const filtered = rawData.filter(log => 
              log.record_type === 'daily_logs_v2' && 
              log.log_date === viewDate && 
              !log.is_deleted
            );
            
            console.log(`🕵️ [Daily Logs] Records matching today (${viewDate}): ${filtered.length}`);

            setAllLogs(filtered);
            setIsLogsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load daily logs:', err);
        if (isMounted) setIsLogsLoading(false);
      }
    };

    loadLogs();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, [viewDate]);

  const logs = useMemo(() => allLogs, [allLogs]);

  const getTodayLog = useCallback((animalId: string, type: LogType) => {
    return logs.find(log => log.animal_id === animalId && log.log_type === type);
  }, [logs]);

  const addLogEntry = useCallback(async (entry: Partial<LogEntry>) => {
    const db = coreDB || await bootCoreDatabase();
    const payload = {
      ...entry,
      id: entry.id || crypto.randomUUID(),
      record_type: 'daily_logs_v2',
      updated_at: new Date().toISOString(),
      is_deleted: false
    };
    await db.daily_records.upsert(payload);
  }, []);

  const filteredAnimals = useMemo(() => {
    return animals.filter(a => activeCategory === 'all' || a.category === activeCategory);
  }, [animals, activeCategory]);

  return { animals: filteredAnimals, getTodayLog, addLogEntry, isLoading: animalsLoading || isLogsLoading };
};