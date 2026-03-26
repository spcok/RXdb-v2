import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { bootCoreDatabase } from '../lib/DatabaseCore';
import { AnimalCategory, OperationalList } from '../types';

export function useOperationalLists(category: AnimalCategory = AnimalCategory.ALL) {
  const [lists, setLists] = useState<OperationalList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.operational_lists.find().$.subscribe(docs => {
          if (isMounted) {
            setLists(docs.map(d => d.toJSON() as OperationalList).filter(d => !d.is_deleted));
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load operational lists:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const foodTypes = lists
    .filter(l => l.type === 'food' && (l.category === category || l.category === AnimalCategory.ALL))
    .sort((a, b) => a.value.localeCompare(b.value));
  const feedMethods = lists
    .filter(l => l.type === 'method' && (l.category === category || l.category === AnimalCategory.ALL))
    .sort((a, b) => a.value.localeCompare(b.value));
  const eventTypes = lists
    .filter(l => l.type === 'event')
    .sort((a, b) => a.value.localeCompare(b.value));
  const locations = lists
    .filter(l => l.type === 'location')
    .sort((a, b) => a.value.localeCompare(b.value));

  const addListItem = async (type: 'food' | 'method' | 'location' | 'event', value: string, itemCategory: AnimalCategory = category) => {
    if (!value.trim()) return;
    
    const db = await bootCoreDatabase();
    const val = value.trim();
    
    const exists = lists.find(l => 
      l.type === type && 
      l.value.toLowerCase() === val.toLowerCase() && 
      (type === 'location' || type === 'event' || l.category === itemCategory)
    );
    
    if (exists) return;

    const payload = {
      id: uuidv4(),
      type,
      category: (type === 'location' || type === 'event') ? AnimalCategory.ALL : itemCategory,
      value: val,
      updated_at: new Date().toISOString(),
      is_deleted: false
    };

    await db.operational_lists.upsert(payload);
  };

  const updateListItem = async (id: string, value: string) => {
    if (!value.trim()) return;
    
    const db = await bootCoreDatabase();
    const itemDoc = await db.operational_lists.findOne(id).exec();
    if (itemDoc) {
      const item = itemDoc.toJSON();
      await db.operational_lists.upsert({ 
        ...item, 
        value: value.trim(),
        updated_at: new Date().toISOString()
      });
    }
  };

  const removeListItem = async (id: string) => {
    const db = await bootCoreDatabase();
    const itemDoc = await db.operational_lists.findOne(id).exec();
    if (itemDoc) {
      const item = itemDoc.toJSON();
      await db.operational_lists.upsert({ 
        ...item, 
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    foodTypes,
    feedMethods,
    eventTypes,
    locations,
    addListItem,
    updateListItem,
    removeListItem,
    isLoading
  };
}
