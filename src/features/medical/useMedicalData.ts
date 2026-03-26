import { useState, useEffect } from 'react';
import { ClinicalNote, MARChart, QuarantineRecord, Animal } from '../../types';
import { bootCoreDatabase } from '../../lib/DatabaseCore';

export function useMedicalData() {
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [marCharts, setMarCharts] = useState<MARChart[]>([]);
  const [quarantineRecords, setQuarantineRecords] = useState<QuarantineRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subs: { unsubscribe: () => void }[] = [];

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        subs = [
          // 🚨 Medical Logs
          db.clinical_records.find({
            selector: { record_type: 'medical_logs' }
          }).$.subscribe(docs => {
            if (isMounted) {
              const rawData = docs.map(d => d.toJSON() as ClinicalNote);
              const active = rawData.filter(d => !d.is_deleted);
              setClinicalNotes(active.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
            }
          }),

          // 🚨 MAR Charts
          db.clinical_records.find({
            selector: { record_type: 'mar_charts' }
          }).$.subscribe(docs => {
            if (isMounted) {
              const rawData = docs.map(d => d.toJSON() as MARChart);
              const active = rawData.filter(d => !d.is_deleted);
              setMarCharts(active.sort((a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime()));
            }
          }),

          // 🚨 Quarantine
          db.clinical_records.find({
            selector: { record_type: 'quarantine_records' }
          }).$.subscribe(docs => {
            if (isMounted) {
              const rawData = docs.map(d => d.toJSON() as QuarantineRecord);
              const active = rawData.filter(d => !d.is_deleted);
              setQuarantineRecords(active.sort((a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime()));
            }
          }),

          // 🚨 Animals
          db.animals.find({
            selector: { record_type: 'animals' }
          }).$.subscribe(docs => {
            if (isMounted) {
              const rawData = docs.map(d => d.toJSON() as Animal);
              setAnimals(rawData.filter(a => !a.is_deleted).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
              setIsLoading(false);
            }
          })
        ];
      } catch (err) {
        console.error('Failed to load medical data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      subs.forEach(sub => sub.unsubscribe());
    };
  }, []);

  // ... (keep the add/update functions exactly the same as previous)
  const addClinicalNote = async (note: Omit<ClinicalNote, 'id' | 'animal_name'>) => {
    const db = await bootCoreDatabase();
    const animalDoc = await db.animals.findOne(note.animal_id).exec();
    const newNote = { ...note, id: crypto.randomUUID(), record_type: 'medical_logs', animal_name: animalDoc?.name || 'Unknown', updated_at: new Date().toISOString(), is_deleted: false } as ClinicalNote;
    await db.clinical_records.upsert(newNote);
  };

  const updateClinicalNote = async (note: ClinicalNote) => {
    const db = await bootCoreDatabase();
    await db.clinical_records.upsert({ ...note, record_type: 'medical_logs', updated_at: new Date().toISOString() });
  };

  const addMarChart = async (chart: Omit<MARChart, 'id' | 'animal_name' | 'administered_dates' | 'status'>) => {
    const db = await bootCoreDatabase();
    const animalDoc = await db.animals.findOne(chart.animal_id).exec();
    const newChart = { ...chart, id: crypto.randomUUID(), record_type: 'mar_charts', animal_name: animalDoc?.name || 'Unknown', administered_dates: [], status: 'Active', updated_at: new Date().toISOString(), is_deleted: false } as MARChart;
    await db.clinical_records.upsert(newChart);
  };

  const updateMarChart = async (chart: MARChart) => {
    const db = await bootCoreDatabase();
    await db.clinical_records.upsert({ ...chart, record_type: 'mar_charts', updated_at: new Date().toISOString() });
  };

  const signOffDose = async (chartId: string, dateIso: string) => {
    const db = await bootCoreDatabase();
    const chartDoc = await db.clinical_records.findOne(chartId).exec();
    if (chartDoc) {
      const chart = chartDoc.toJSON();
      await db.clinical_records.upsert({ ...chart, record_type: 'mar_charts', administered_dates: [...chart.administered_dates, dateIso], updated_at: new Date().toISOString() });
    }
  };

  const addQuarantineRecord = async (record: Omit<QuarantineRecord, 'id' | 'animal_name' | 'status'>) => {
    const db = await bootCoreDatabase();
    const animalDoc = await db.animals.findOne(record.animal_id).exec();
    const newRecord = { ...record, id: crypto.randomUUID(), record_type: 'quarantine_records', animal_name: animalDoc?.name || 'Unknown', status: 'Active', updated_at: new Date().toISOString(), is_deleted: false } as QuarantineRecord;
    await db.clinical_records.upsert(newRecord);
  };

  const updateQuarantineRecord = async (record: QuarantineRecord) => {
    const db = await bootCoreDatabase();
    await db.clinical_records.upsert({ ...record, record_type: 'quarantine_records', updated_at: new Date().toISOString() });
  };

  return { clinicalNotes, marCharts, quarantineRecords, animals, isLoading, addClinicalNote, updateClinicalNote, addMarChart, updateMarChart, signOffDose, addQuarantineRecord, updateQuarantineRecord };
}