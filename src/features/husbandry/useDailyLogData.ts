import { useCallback, useMemo, useState, useEffect } from 'react';
import { LogEntry, LogType } from '../../types';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
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
        const db = await bootCoreDatabase();
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
            
            // 🚨 CRITICAL FIX: Robust Date Fallback Sort (Newest First)
            const sorted = filtered.sort((a, b) => {
              const timeA = new Date(a.log_date || a.created_at || 0).getTime();
              const timeB = new Date(b.log_date || b.created_at || 0).getTime();
              return timeB - timeA;
            });

            console.log(`🕵️ [Daily Logs] Records matching today (${viewDate}): ${sorted.length}`);

            setAllLogs(sorted);
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
    const db = await bootCoreDatabase();
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