import { createRxDatabase, addRxPlugin, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { replicateSupabase, RxSupabaseReplicationState } from 'rxdb/plugins/replication-supabase';

addRxPlugin(RxDBDevModePlugin);

export let coreDB: RxDatabase;
let bootPromise: Promise<RxDatabase> | null = null;
const activeReplications: RxSupabaseReplicationState<unknown>[] = [];

const _global = window as any;
if (!_global.__CORE_SYNC_TIMERS__) _global.__CORE_SYNC_TIMERS__ = [];

const SYNC_MAP: Record<string, { table: string, type: string }[]> = {
  animals: [{ table: 'animals', type: 'animals' }, { table: 'archived_animals', type: 'archived_animals' }],
  daily_records: [{ table: 'daily_logs', type: 'daily_logs_v2' }, { table: 'daily_rounds', type: 'daily_rounds' }],
  clinical_records: [{ table: 'medical_logs', type: 'medical_logs' }, { table: 'mar_charts', type: 'mar_charts' }, { table: 'quarantine_records', type: 'quarantine_records' }],
  logistics_records: [{ table: 'internal_movements', type: 'internal_movements' }, { table: 'external_transfers', type: 'external_transfers' }],
  staff_records: [{ table: 'shifts', type: 'shifts' }, { table: 'holidays', type: 'holidays' }, { table: 'timesheets', type: 'timesheets' }],
  maintenance_logs: [{ table: 'maintenance_logs', type: 'maintenance_logs' }],
  incidents: [{ table: 'incidents', type: 'incidents' }],
  first_aid_logs: [{ table: 'first_aid_logs', type: 'first_aid_logs' }],
  safety_drills: [{ table: 'safety_drills', type: 'safety_drills' }],
  operational_lists: [{ table: 'operational_lists', type: 'operational_lists' }],
  admin_records: [{ table: 'users', type: 'user' }, { table: 'organisations', type: 'organisation' }, { table: 'role_permissions', type: 'role_permission' }, { table: 'contacts', type: 'contact' }, { table: 'zla_documents', type: 'zla_document' }, { table: 'bug_reports', type: 'bug_report' }],
  tasks: [{ table: 'tasks', type: 'tasks' }]
};

// 🚨 THE FIX: added additionalProperties: true to the base definition!
const baseProps = { id: { type: 'string', maxLength: 100 }, created_at: { type: 'string' }, updated_at: { type: 'string' }, is_deleted: { type: 'boolean' }, record_type: { type: 'string' } };

export const bootCoreDatabase = async () => {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    console.log('💾 [Core DB] Booting Engine v38 (Flexible Schemas)...');
    coreDB = await createRxDatabase({ name: 'animaldb_core_v38', storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }), ignoreDuplicate: true });
    
    // 🚨 THE FIX: added additionalProperties: true to every single collection so it accepts ANY column Supabase sends.
    await coreDB.addCollections({
      animals: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      admin_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      daily_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      clinical_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      logistics_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      staff_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      maintenance_logs: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      incidents: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      first_aid_logs: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      safety_drills: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      operational_lists: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } },
      tasks: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: true, properties: { ...baseProps }, required: ['id', 'record_type'] } }
    });
    return coreDB;
  })();
  return bootPromise;
};

export const startCoreSync = async (db: RxDatabase, realSupabaseClient: any) => {
  if (!db || !realSupabaseClient) return;
  console.log('🔄 [Core DB] Engaging Authenticated Synchronization v38...');

  _global.__CORE_SYNC_TIMERS__.forEach((t: NodeJS.Timeout) => clearInterval(t));
  _global.__CORE_SYNC_TIMERS__ = [];
  activeReplications.forEach(state => state.cancel());
  activeReplications.length = 0;

  for (const [colName, configs] of Object.entries(SYNC_MAP)) {
    const collection = db.collections[colName];
    if (!collection) continue;

    for (const config of configs) {
      const executePull = () => {
        try {
          const state = replicateSupabase({
            collection,
            replicationIdentifier: `core_${colName}_${config.table}_v38`,
            client: realSupabaseClient,
            tableName: config.table,
            deletedField: 'is_deleted',
            updatedField: 'updated_at',
            pull: { batchSize: 100, modifier: (doc: any) => ({ ...doc, record_type: config.type }) },
            push: { modifier: (doc: any) => doc.record_type === config.type ? doc : null },
            live: false
          });
          
          state.error$.subscribe(err => {
             if (err?.message && !err.message.includes('Offline')) {
                 console.error(`[Core Sync Error] ${config.table}:`, err);
             }
          });
          
          activeReplications.push(state);
        } catch (err) {}
      };
      
      executePull(); 
      const timer = setInterval(executePull, 30000); 
      _global.__CORE_SYNC_TIMERS__.push(timer); 
    }
  }
};