import { useState, useEffect } from 'react';
import { ClinicalNote, MARChart, QuarantineRecord, Animal } from '../../types';
import { coreDB, bootCoreDatabase } from '../../lib/DatabaseCore';

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
        const db = coreDB || await bootCoreDatabase();
        if (!isMounted) return;

        const clinicalSub = db.clinical_records.find({
          selector: { 
            is_deleted: { $eq: false },
            record_type: { $eq: 'medical_logs' }
          },
          sort: [{ date: 'desc' }]
        }).$.subscribe(docs => {
          if (isMounted) setClinicalNotes(docs.map(d => d.toJSON() as ClinicalNote));
        });

        const marSub = db.clinical_records.find({
          selector: { 
            is_deleted: { $eq: false },
            record_type: { $eq: 'mar_charts' }
          },
          sort: [{ start_date: 'desc' }]
        }).$.subscribe(docs => {
          if (isMounted) setMarCharts(docs.map(d => d.toJSON() as MARChart));
        });

        const quarantineSub = db.clinical_records.find({
          selector: { 
            is_deleted: { $eq: false },
            record_type: { $eq: 'quarantine_records' }
          },
          sort: [{ start_date: 'desc' }]
        }).$.subscribe(docs => {
          if (isMounted) setQuarantineRecords(docs.map(d => d.toJSON() as QuarantineRecord));
        });

        const animalsSub = db.animals.find({
          selector: { is_deleted: { $eq: false } }
        }).$.subscribe(docs => {
          if (isMounted) {
            setAnimals(docs.map(d => d.toJSON() as Animal));
            setIsLoading(false);
          }
        });

        subs = [clinicalSub, marSub, quarantineSub, animalsSub];
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

  const addClinicalNote = async (note: Omit<ClinicalNote, 'id' | 'animal_name'>) => {
    const db = coreDB || await bootCoreDatabase();
    const animalDoc = await db.animals.findOne(note.animal_id).exec();
    const newNote: ClinicalNote = {
      ...note,
      id: crypto.randomUUID(),
      record_type: 'medical_logs',
      animal_name: animalDoc?.name || 'Unknown',
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as ClinicalNote;
    await db.clinical_records.upsert(newNote);
  };

  const updateClinicalNote = async (note: ClinicalNote) => {
    const db = coreDB || await bootCoreDatabase();
    await db.clinical_records.upsert({
      ...note,
      record_type: 'medical_logs',
      updated_at: new Date().toISOString()
    });
  };

  const addMarChart = async (chart: Omit<MARChart, 'id' | 'animal_name' | 'administered_dates' | 'status'>) => {
    const db = coreDB || await bootCoreDatabase();
    const animalDoc = await db.animals.findOne(chart.animal_id).exec();
    const newChart: MARChart = {
      ...chart,
      id: crypto.randomUUID(),
      record_type: 'mar_charts',
      animal_name: animalDoc?.name || 'Unknown',
      administered_dates: [],
      status: 'Active',
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as MARChart;
    await db.clinical_records.upsert(newChart);
  };

  const updateMarChart = async (chart: MARChart) => {
    const db = coreDB || await bootCoreDatabase();
    await db.clinical_records.upsert({
      ...chart,
      record_type: 'mar_charts',
      updated_at: new Date().toISOString()
    });
  };

  const signOffDose = async (chartId: string, dateIso: string) => {
    const db = coreDB || await bootCoreDatabase();
    const chartDoc = await db.clinical_records.findOne(chartId).exec();
    if (chartDoc) {
      const chart = chartDoc.toJSON();
      await db.clinical_records.upsert({
        ...chart,
        record_type: 'mar_charts',
        administered_dates: [...chart.administered_dates, dateIso],
        updated_at: new Date().toISOString()
      });
    }
  };

  const addQuarantineRecord = async (record: Omit<QuarantineRecord, 'id' | 'animal_name' | 'status'>) => {
    const db = coreDB || await bootCoreDatabase();
    const animalDoc = await db.animals.findOne(record.animal_id).exec();
    const newRecord: QuarantineRecord = {
      ...record,
      id: crypto.randomUUID(),
      record_type: 'quarantine_records',
      animal_name: animalDoc?.name || 'Unknown',
      status: 'Active',
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as QuarantineRecord;
    await db.clinical_records.upsert(newRecord);
  };

  const updateQuarantineRecord = async (record: QuarantineRecord) => {
    const db = coreDB || await bootCoreDatabase();
    await db.clinical_records.upsert({
      ...record,
      record_type: 'quarantine_records',
      updated_at: new Date().toISOString()
    });
  };

  return { 
    clinicalNotes, 
    marCharts, 
    quarantineRecords, 
    animals, 
    isLoading, 
    addClinicalNote, 
    updateClinicalNote, 
    addMarChart, 
    updateMarChart, 
    signOffDose, 
    addQuarantineRecord, 
    updateQuarantineRecord 
  };
}
