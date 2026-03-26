import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { ExternalTransfer } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useTransfersData() {
  const [transfers, setTransfers] = useState<ExternalTransfer[]>([]);
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
            
            record_type: { $eq: 'transfers' }
          }
        }).$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as ExternalTransfer).filter(d => !d.is_deleted);
            const sortedData = rawData.sort((a, b) => new Date((b as any).transfer_date || 0).getTime() - new Date((a as any).transfer_date || 0).getTime());
            setTransfers(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load transfers data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const addTransfer = async (transfer: Omit<ExternalTransfer, 'id'>) => {
    const db = await bootCoreDatabase();
    const newTransfer: ExternalTransfer = {
      ...transfer,
      id: uuidv4(),
      record_type: 'transfers',
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as ExternalTransfer;
    await db.logistics_records.upsert(newTransfer);
  };

  return {
    transfers,
    isLoading,
    addTransfer
  };
}
