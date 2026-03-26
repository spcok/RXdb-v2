import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { Contact } from '../../types';

export function useDirectoryData() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadContacts = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.admin_records.find({
          selector: {
            record_type: 'contact'}
        }).$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as Contact).filter(d => !(d as any).is_deleted);
            const sortedData = rawData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setContacts(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load directory data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadContacts();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const addContact = async (contact: Omit<Contact, 'id'>) => {
    const db = await bootCoreDatabase();
    const id = uuidv4();
    const newContact = {
      ...contact,
      id,
      record_type: 'contact',
      is_deleted: false,
      updated_at: new Date().toISOString()
    };
    try {
      await db.admin_records.upsert(newContact);
    } catch (err) {
      console.error('Failed to add contact:', err);
    }
  };

  const updateContact = async (contact: Contact) => {
    const db = await bootCoreDatabase();
    try {
      await db.admin_records.upsert({
        ...contact,
        record_type: 'contact',
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update contact:', err);
    }
  };

  const deleteContact = async (id: string) => {
    const db = await bootCoreDatabase();
    try {
      const doc = await db.admin_records.findOne(id).exec();
      if (doc) {
        await doc.patch({
          is_deleted: true,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  return { contacts, isLoading, addContact, updateContact, deleteContact };
}
