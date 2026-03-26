import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { Animal } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useAnimalsData } from './useAnimalsData';

// 🚨 1. Removed the 'export' keyword and props from here
const AnimalsList = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'archived'>('live');
  const [archivedAnimals, setArchivedAnimals] = useState<Animal[]>([]);
  
  const permissions = usePermissions();
  const navigate = useNavigate();
  
  // 🚨 2. Fetching the live animals directly inside the component
  const { animals } = useAnimalsData(); 

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.animals.find({
          selector: { record_type: 'archived_animals' }
        }).$.subscribe(docs => {
          if (isMounted) {
            setArchivedAnimals(docs.map(d => d.toJSON() as Animal).filter(d => !d.is_deleted));
          }
        });
      } catch (err) {
        console.error('Failed to load archived animals:', err);
      }
    };

    loadData();
    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const canViewArchived = permissions.isAdmin || permissions.isOwner;

  // 🚨 3. Handling the click routing natively
  const handleSelectAnimal = (animal: Animal) => {
    navigate(`/animals/${animal.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Animals Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view the animal collection.</p>
        </div>
      </div>

      {canViewArchived && (
        <div className="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'live' ? 'bg-blue-50 text-blue-700 rounded-xl font-bold' : 'text-slate-600 hover:bg-slate-100 rounded-xl'
            }`}
          >
            Live Collection
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'archived' ? 'bg-blue-50 text-blue-700 rounded-xl font-bold' : 'text-slate-600 hover:bg-slate-100 rounded-xl'
            }`}
          >
            Archived Records
          </button>
        </div>
      )}

      {activeTab === 'live' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {animals.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No live animals found.</div>
            ) : (
                animals.map(animal => (
                    <div key={animal.id} className="p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSelectAnimal(animal)}>
                        <span className="font-bold text-slate-900">{animal.name}</span> <span className="text-slate-500">- {animal.species}</span>
                    </div>
                ))
            )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {archivedAnimals.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No archived records found.</div>
          ) : (
              archivedAnimals.map(animal => (
                <div key={animal.id} className="p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSelectAnimal(animal)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{animal.name}</div>
                      <div className="text-sm text-slate-500">{animal.species}</div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <div>Reason: {animal.archive_reason || 'Unknown'}</div>
                      <div>Archived: {animal.archived_at ? new Date(animal.archived_at).toLocaleDateString() : '--'}</div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};

// 🚨 4. Providing the required default export
export default AnimalsList;