import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { Incident } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const useIncidentData = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.incidents.find().$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as Incident).filter(d => !d.is_deleted);
            const sortedData = rawData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            setIncidents(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load incident data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || i.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const addIncident = async (incident: Omit<Incident, 'id'>) => {
    const db = await bootCoreDatabase();
    const newIncident: Incident = { 
      ...incident, 
      id: uuidv4(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as Incident;
    await db.incidents.upsert(newIncident);
  };

  const deleteIncident = async (id: string) => {
    const db = await bootCoreDatabase();
    const incidentDoc = await db.incidents.findOne(id).exec();
    if (incidentDoc) {
      const incident = incidentDoc.toJSON();
      await db.incidents.upsert({
        ...incident,
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    incidents: filteredIncidents,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterSeverity,
    setFilterSeverity,
    addIncident,
    deleteIncident
  };
};
