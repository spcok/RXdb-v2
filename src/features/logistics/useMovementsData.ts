import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { InternalMovement } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useMovementsData() {
  const [movements, setMovements] = useState<InternalMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.logistics_records.find({
          selector: { 
            
            record_type: { $eq: 'movements' }
          }
        }).$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as InternalMovement).filter(d => !d.is_deleted);
            const sortedData = rawData.sort((a, b) => new Date(b.log_date || 0).getTime() - new Date(a.log_date || 0).getTime());
            setMovements(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load movements data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const addMovement = async (movement: Omit<InternalMovement, 'id' | 'created_by'>) => {
    const db = await bootCoreDatabase();
    const newMovement: InternalMovement = {
      ...movement,
      id: uuidv4(),
      record_type: 'movements',
      created_by: 'SYS', // Mock user
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as InternalMovement;
    await db.logistics_records.upsert(newMovement);
  };

  return {
    movements,
    isLoading,
    addMovement
  };
}