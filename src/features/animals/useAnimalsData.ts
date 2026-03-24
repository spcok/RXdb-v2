import { useState, useEffect } from 'react';
import { Animal } from '../../types';
import { coreDB, bootCoreDatabase } from '../../lib/DatabaseCore';

export function useAnimalsData() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadAnimals = async () => {
      try {
        const db = coreDB || await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.animals.find({
          selector: { is_deleted: { $eq: false } },
          sort: [{ name: 'asc' }]
        }).$.subscribe({
          next: (docs) => {
            if (isMounted) {
              setAnimals(docs.map(d => d.toJSON() as Animal));
              setIsLoading(false);
            }
          },
          error: (err) => {
            console.error('Error fetching animals:', err);
            if (isMounted) {
              setError(err);
              setIsLoading(false);
            }
          }
        });
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadAnimals();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  return {
    animals,
    isLoading,
    error
  };
}
