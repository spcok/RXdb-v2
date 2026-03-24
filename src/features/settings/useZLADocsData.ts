import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { coreDB, bootCoreDatabase } from '../../lib/DatabaseCore';
import { ZLADocument } from '../../types';

export function useZLADocsData() {
  const [documents, setDocuments] = useState<ZLADocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadDocs = async () => {
      try {
        const db = coreDB || await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.admin_records.find({
          selector: {
            record_type: 'zla_document',
            is_deleted: { $eq: false }
          }
        }).$.subscribe(docs => {
          if (isMounted) {
            setDocuments(docs.map(d => d.toJSON() as ZLADocument));
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load ZLA docs data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadDocs();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const addDocument = async (doc: Omit<ZLADocument, 'id'>) => {
    const db = coreDB || await bootCoreDatabase();
    const id = uuidv4();
    const newDoc = {
      ...doc,
      id,
      record_type: 'zla_document',
      is_deleted: false,
      updated_at: new Date().toISOString()
    };
    try {
      await db.admin_records.upsert(newDoc);
    } catch (err) {
      console.error('Failed to add document:', err);
    }
  };

  const deleteDocument = async (id: string) => {
    const db = coreDB || await bootCoreDatabase();
    try {
      const doc = await db.admin_records.findOne(id).exec();
      if (doc) {
        await doc.patch({
          is_deleted: true,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  return { documents, isLoading, addDocument, deleteDocument };
}
