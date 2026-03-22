import { createRxDatabase, addRxPlugin, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { replicateSupabase, RxSupabaseReplicationState } from 'rxdb/plugins/replication-supabase';
import { supabase } from './supabase';

addRxPlugin(RxDBDevModePlugin);

export let databaseInstance: RxDatabase;
let dbInitPromise: Promise<RxDatabase> | null = null;
const activeSyncStates: RxSupabaseReplicationState<unknown>[] = [];

const SYNC_MAP: Record<string, { table: string, type: string }[]> = {
  animals: [{ table: 'animals', type: 'animals' }, { table: 'archived_animals', type: 'archived_animals' }],
  daily_records: [{ table: 'daily_logs', type: 'daily_logs_v2' }, { table: 'daily_rounds', type: 'daily_rounds' }],
  clinical_records: [{ table: 'medical_logs', type: 'medical_logs' }, { table: 'mar_charts', type: 'mar_charts' }, { table: 'quarantine_records', type: 'quarantine_records' }, { table: 'clinical_note', type: 'clinical_note' }],
  logistics_records: [{ table: 'internal_movements', type: 'internal_movements' }, { table: 'external_transfers', type: 'external_transfers' }, { table: 'movements', type: 'movements' }, { table: 'transfers', type: 'transfers' }],
  staff_records: [{ table: 'shifts', type: 'shifts' }, { table: 'holidays', type: 'holidays' }, { table: 'timesheets', type: 'timesheets' }],
  maintenance_logs: [{ table: 'maintenance_logs', type: 'maintenance_logs' }],
  incidents: [{ table: 'incidents', type: 'incidents' }],
  first_aid_logs: [{ table: 'first_aid_logs', type: 'first_aid_logs' }],
  safety_drills: [{ table: 'safety_drills', type: 'safety_drills' }],
  operational_lists: [{ table: 'operational_lists', type: 'operational_lists' }],
  admin_records: [{ table: 'users', type: 'user' }, { table: 'organisations', type: 'organisation' }, { table: 'role_permissions', type: 'role_permission' }, { table: 'contacts', type: 'contact' }, { table: 'zla_documents', type: 'zla_document' }, { table: 'bug_reports', type: 'bug_report' }],
  tasks: [{ table: 'tasks', type: 'tasks' }]
};

const baseColumns = { id: { type: 'string', maxLength: 100 }, created_at: { type: 'string' }, updated_at: { type: 'string' }, is_deleted: { type: 'boolean' }, record_type: { type: 'string' } };

export const bootDatabase = async () => {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    console.log('💾 [Engine] Booting v25...');
    databaseInstance = await createRxDatabase({ name: 'animaldb_v25', storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }), ignoreDuplicate: true });
    await databaseInstance.addCollections({
      animals: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, name: { type: 'string' }, species: { type: 'string' }, category: { type: 'string' }, location: { type: 'string' }, latin_name: { type: 'string' }, entity_type: { type: 'string' }, parent_mob_id: { type: 'string' }, census_count: { type: 'number' }, hazard_rating: { type: 'string' }, is_venomous: { type: 'boolean' }, weight_unit: { type: 'string' }, dob: { type: 'string' }, is_dob_unknown: { type: 'boolean' }, sex: { type: 'string' }, microchip_id: { type: 'string' }, ring_number: { type: 'string' }, disposition_status: { type: 'string' }, archived: { type: 'boolean' } }, required: ['id', 'record_type'] } },
      admin_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' }, initials: { type: 'string' }, permissions: { type: 'object' }, type: { type: 'string' }, value: { type: 'string' }, pin: { type: 'string' } }, required: ['id', 'record_type'] } },
      daily_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, animal_id: { type: 'string' }, log_type: { type: 'string' }, log_date: { type: 'string' }, value: { type: 'string' }, notes: { type: 'string' }, user_initials: { type: 'string' }, weight_grams: { type: 'number' }, weight: { type: 'number' }, weight_unit: { type: 'string' }, health_record_type: { type: 'string' }, shift: { type: 'string' }, section: { type: 'string' }, completed_by: { type: 'string' }, temperature_c: { type: 'number' } }, required: ['id', 'record_type'] } },
      clinical_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, animal_id: { type: 'string' }, animal_name: { type: 'string' }, date: { type: 'string' }, note_type: { type: 'string' }, note_text: { type: 'string' }, staff_initials: { type: 'string' }, medication: { type: 'string' }, dosage: { type: 'string' }, frequency: { type: 'string' }, status: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' }, reason: { type: 'string' }, bcs: { type: 'number' }, weight: { type: 'number' }, isolation_notes: { type: 'string' } }, required: ['id', 'record_type'] } },
      logistics_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, animal_id: { type: 'string' }, animal_name: { type: 'string' }, log_date: { type: 'string' }, date: { type: 'string' }, movement_type: { type: 'string' }, transfer_type: { type: 'string' }, source_location: { type: 'string' }, destination_location: { type: 'string' }, institution: { type: 'string' }, status: { type: 'string' }, created_by: { type: 'string' } }, required: ['id', 'record_type'] } },
      staff_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, user_id: { type: 'string' }, staff_name: { type: 'string' }, date: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' }, clock_in: { type: 'string' }, clock_out: { type: 'string' }, status: { type: 'string' }, shift_type: { type: 'string' }, leave_type: { type: 'string' } }, required: ['id', 'record_type'] } },
      maintenance_logs: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, enclosure_id: { type: 'string' }, task_type: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' }, date_logged: { type: 'string' }, date_completed: { type: 'string' } }, required: ['id', 'record_type'] } },
      incidents: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, date: { type: 'string' }, time: { type: 'string' }, type: { type: 'string' }, severity: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' }, status: { type: 'string' }, reported_by: { type: 'string' } }, required: ['id', 'record_type'] } },
      first_aid_logs: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, date: { type: 'string' }, time: { type: 'string' }, person_name: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' }, treatment: { type: 'string' }, location: { type: 'string' }, outcome: { type: 'string' } }, required: ['id', 'record_type'] } },
      safety_drills: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, date: { type: 'string' }, title: { type: 'string' }, location: { type: 'string' }, priority: { type: 'string' }, status: { type: 'string' }, description: { type: 'string' } }, required: ['id', 'record_type'] } },
      operational_lists: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, type: { type: 'string' }, category: { type: 'string' }, value: { type: 'string' } }, required: ['id', 'record_type'] } },
      tasks: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseColumns, animal_id: { type: 'string' }, title: { type: 'string' }, due_date: { type: 'string' }, completed: { type: 'boolean' }, assigned_to: { type: 'string' }, type: { type: 'string' }, notes: { type: 'string' } }, required: ['id', 'record_type'] } }
    });
    return databaseInstance;
  })();
  return dbInitPromise;
};

export const launchSync = async (db: RxDatabase) => {
  if (!db || !supabase) return;
  console.log('🔄 [Engine] Launching Safe Polling...');

  for (const [colName, configs] of Object.entries(SYNC_MAP)) {
    const collection = db.collections[colName];
    if (!collection) continue;

    for (const config of configs) {
      const fire = () => {
        try {
          const state = replicateSupabase({
            collection,
            replicationIdentifier: `safe_${colName}_${config.table}_v25`,
            supabaseClient: supabase, // ABSOLUTELY MUST BE supabaseClient
            table: config.table,      // ABSOLUTELY MUST BE table
            deletedField: 'is_deleted',
            pull: { batchSize: 100, modifier: (doc) => ({ ...doc, record_type: config.type }) },
            push: { filter: (doc) => doc.record_type === config.type },
            live: false
          });
          state.error$.subscribe(err => console.error(`[Sync] ${config.table}:`, err));
          activeSyncStates.push(state);
        } catch (err) {
          console.error(`[Sync] Critical failure on ${config.table}:`, err);
        }
      };
      fire(); setInterval(fire, 30000);
    }
  }
};
