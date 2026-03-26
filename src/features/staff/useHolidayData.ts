import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { Holiday } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useHolidayData() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.staff_records.find({
          selector: { 
            
            record_type: { $eq: 'holidays' }
          }
        }).$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as Holiday).filter(d => !d.is_deleted);
            const sortedData = rawData.sort((a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime());
            setHolidays(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load holiday data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const addHoliday = async (holiday: Omit<Holiday, 'id'>) => {
    const db = await bootCoreDatabase();
    const newHoliday: Holiday = {
      ...holiday,
      id: uuidv4(),
      record_type: 'holidays',
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as Holiday;
    await db.staff_records.upsert(newHoliday);
  };

  const deleteHoliday = async (id: string) => {
    const db = await bootCoreDatabase();
    const holidayDoc = await db.staff_records.findOne(id).exec();
    if (holidayDoc) {
      const holiday = holidayDoc.toJSON();
      await db.staff_records.upsert({
        ...holiday,
        record_type: 'holidays',
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    holidays,
    isLoading,
    addHoliday,
    deleteHoliday
  };
}
