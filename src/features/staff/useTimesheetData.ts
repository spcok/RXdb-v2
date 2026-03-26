import { useState, useEffect } from 'react';
import { bootCoreDatabase } from '../../lib/DatabaseCore';
import { Timesheet, TimesheetStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useTimesheetData() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.staff_records.find({
          selector: { 
            
            record_type: { $eq: 'timesheets' }
          }
        }).$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as Timesheet).filter(d => !d.is_deleted);
            const sortedData = rawData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            setTimesheets(sortedData);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load timesheet data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const clockIn = async (staff_name: string) => {
    const db = await bootCoreDatabase();
    const newTimesheet: Timesheet = {
      id: uuidv4(),
      record_type: 'timesheets',
      staff_name,
      date: new Date().toISOString().split('T')[0],
      clock_in: new Date().toISOString(),
      status: TimesheetStatus.ACTIVE,
      updated_at: new Date().toISOString(),
      is_deleted: false
    };
    await db.staff_records.upsert(newTimesheet);
  };

  const clockOut = async (id: string) => {
    const db = await bootCoreDatabase();
    const timesheetDoc = await db.staff_records.findOne(id).exec();
    if (timesheetDoc) {
      const timesheet = timesheetDoc.toJSON();
      await db.staff_records.upsert({
        ...timesheet,
        record_type: 'timesheets',
        clock_out: new Date().toISOString(),
        status: TimesheetStatus.COMPLETED,
        updated_at: new Date().toISOString()
      });
    }
  };

  const getCurrentlyClockedInStaff = async () => {
    const db = await bootCoreDatabase();
    const active = await db.staff_records.find({
      selector: { 
        status: { $eq: TimesheetStatus.ACTIVE },
        
        record_type: { $eq: 'timesheets' }
      }
    }).exec();
    return active.map(t => t.staff_name);
  };

  const addTimesheet = async (timesheet: Omit<Timesheet, 'id'>) => {
    const db = await bootCoreDatabase();
    const newTimesheet: Timesheet = {
      ...timesheet,
      id: uuidv4(),
      record_type: 'timesheets',
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as Timesheet;
    await db.staff_records.upsert(newTimesheet);
  };

  const deleteTimesheet = async (id: string) => {
    const db = await bootCoreDatabase();
    const timesheetDoc = await db.staff_records.findOne(id).exec();
    if (timesheetDoc) {
      const timesheet = timesheetDoc.toJSON();
      await db.staff_records.upsert({
        ...timesheet,
        record_type: 'timesheets',
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    timesheets,
    isLoading,
    clockIn,
    clockOut,
    getCurrentlyClockedInStaff,
    addTimesheet,
    deleteTimesheet
  };
}
