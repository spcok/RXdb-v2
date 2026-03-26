import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { SafetyDrill } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useSafetyDrillData() {
  const [drills, setDrills] = useState<SafetyDrill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.safety_drills.find().$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as SafetyDrill).filter(d => !d.is_deleted);
            const sortedData = rawData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            setDrills(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load safety drill data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const addDrillLog = async (drill: Omit<SafetyDrill, 'id'>) => {
    const db = await bootCoreDatabase();
    const newDrill: SafetyDrill = {
      ...drill,
      id: uuidv4(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as SafetyDrill;
    await db.safety_drills.upsert(newDrill);
  };

  const deleteDrillLog = async (id: string) => {
    const db = await bootCoreDatabase();
    const drillDoc = await db.safety_drills.findOne(id).exec();
    if (drillDoc) {
      const drill = drillDoc.toJSON();
      await db.safety_drills.upsert({
        ...drill,
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    drills,
    isLoading,
    addDrillLog,
    deleteDrillLog
  };
}
