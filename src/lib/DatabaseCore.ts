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

// 🚨 The Flexible Type Generator: Accepts ANY data type Supabase sends without crashing.
const flex = { type: ['string', 'number', 'boolean', 'object', 'array', 'null'] };
const makeProps = (keys: string[]) => keys.reduce((acc, key) => ({ ...acc, [key]: flex }), {});

const baseProps = { id: { type: 'string', maxLength: 100 }, record_type: { type: 'string' }, ...makeProps(['created_at', 'updated_at', 'is_deleted']) };

// 🚨 Explicit extraction of ALL columns from your Supabase logs
const animalKeys = ['entity_type', 'parent_mob_id', 'census_count', 'name', 'species', 'latin_name', 'category', 'location', 'image_url', 'hazard_rating', 'is_venomous', 'weight_unit', 'dob', 'is_dob_unknown', 'sex', 'microchip_id', 'disposition_status', 'origin_location', 'destination_location', 'transfer_date', 'ring_number', 'has_no_id', 'red_list_status', 'description', 'special_requirements', 'critical_husbandry_notes', 'target_day_temp_c', 'target_night_temp_c', 'target_humidity_min_percent', 'target_humidity_max_percent', 'misting_frequency', 'acquisition_date', 'origin', 'sire_id', 'dam_id', 'flying_weight_g', 'winter_weight_g', 'display_order', 'archived', 'archive_reason', 'archived_at', 'archive_type', 'is_quarantine', 'distribution_map_url', 'water_tipping_temp', 'acquisition_type', 'microchip_number', 'birth_date', 'gender', 'website'];
const adminKeys = ['email', 'name', 'role', 'initials', 'job_position', 'permissions', 'signature_data', 'pin', 'deleted_at', 'integrity_seal', 'org_name', 'logo_url', 'contact_email', 'contact_phone', 'address', 'zla_license_number', 'official_website', 'adoption_portal', 'message', 'is_online', 'url', 'user_name', 'view_animals', 'edit_animals', 'view_daily_logs', 'view_tasks', 'view_daily_rounds', 'view_medical', 'edit_medical', 'view_movements', 'view_incidents', 'view_maintenance', 'view_safety_drills', 'view_first_aid', 'view_timesheets', 'view_holidays', 'view_missing_records', 'generate_reports', 'view_settings', 'manage_access_control', 'add_animals', 'archive_animals', 'delete_animals', 'create_daily_logs', 'edit_daily_logs', 'complete_tasks', 'manage_tasks', 'log_daily_rounds', 'add_clinical_notes', 'prescribe_medications', 'administer_medications', 'manage_quarantine', 'log_internal_movements', 'manage_external_transfers', 'report_incidents', 'manage_incidents', 'report_maintenance', 'resolve_maintenance', 'submit_timesheets', 'manage_all_timesheets', 'request_holidays', 'approve_holidays', 'manage_zla_documents', 'manage_users', 'manage_roles', 'view_archived_records', 'type', 'value', 'is_enabled', 'permission_key', 'role_id'];
const dailyKeys = ['animal_id', 'log_type', 'log_date', 'date', 'value', 'notes', 'shift', 'section', 'status', 'completed_by', 'completedBy', 'completed_at', 'check_data', 'temperature_c', 'basking_temp_c', 'cool_temp_c', 'created_by', 'health_record_type', 'weight_grams', 'weight', 'weight_unit', 'user_initials', 'integrity_seal'];
const clinicalKeys = ['animal_id', 'animal_name', 'date', 'note_type', 'note_text', 'recheck_date', 'staff_initials', 'attachment_url', 'thumbnail_url', 'diagnosis', 'bcs', 'weight_grams', 'weight', 'weight_unit', 'treatment_plan', 'integrity_seal', 'medication', 'dosage', 'frequency', 'status', 'start_date', 'end_date', 'reason', 'isolation_notes'];
const logisticsKeys = ['animal_id', 'animal_name', 'log_date', 'date', 'movement_type', 'transfer_type', 'source_location', 'destination_location', 'institution', 'status', 'created_by', 'notes'];
const staffKeys = ['user_id', 'staff_name', 'date', 'start_date', 'end_date', 'clock_in', 'clock_out', 'status', 'shift_type', 'leave_type'];
const maintenanceKeys = ['enclosure_id', 'task_type', 'description', 'status', 'date_logged', 'date_completed'];
const incidentKeys = ['date', 'time', 'type', 'severity', 'description', 'location', 'status', 'reported_by'];
const firstAidKeys = ['date', 'time', 'person_name', 'type', 'description', 'treatment', 'location', 'outcome'];
const safetyDrillKeys = ['date', 'title', 'location', 'priority', 'status', 'description'];
const listKeys = ['type', 'category', 'value'];
const taskKeys = ['animal_id', 'title', 'due_date', 'completed', 'assigned_to', 'type', 'notes'];

export const bootCoreDatabase = async () => {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    console.log('💾 [Core DB] Booting Airtight Engine v45...');
    coreDB = await createRxDatabase({ name: 'animaldb_core_v45', storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }), ignoreDuplicate: true });
    
    await coreDB.addCollections({
      animals: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(animalKeys) }, required: ['id', 'record_type'] } },
      admin_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(adminKeys) }, required: ['id', 'record_type'] } },
      daily_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(dailyKeys) }, required: ['id', 'record_type'] } },
      clinical_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(clinicalKeys) }, required: ['id', 'record_type'] } },
      logistics_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(logisticsKeys) }, required: ['id', 'record_type'] } },
      staff_records: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(staffKeys) }, required: ['id', 'record_type'] } },
      maintenance_logs: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(maintenanceKeys) }, required: ['id', 'record_type'] } },
      incidents: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(incidentKeys) }, required: ['id', 'record_type'] } },
      first_aid_logs: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(firstAidKeys) }, required: ['id', 'record_type'] } },
      safety_drills: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(safetyDrillKeys) }, required: ['id', 'record_type'] } },
      operational_lists: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(listKeys) }, required: ['id', 'record_type'] } },
      tasks: { schema: { version: 0, primaryKey: 'id', type: 'object', properties: { ...baseProps, ...makeProps(taskKeys) }, required: ['id', 'record_type'] } }
    });
    return coreDB;
  })();
  return bootPromise;
};

export const startCoreSync = async (db: RxDatabase, realSupabaseClient: any) => {
  if (!db || !realSupabaseClient) return;
  console.log('🔄 [Core DB] Engaging Authenticated Synchronization v45...');

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
            replicationIdentifier: `core_${colName}_${config.table}_v45`,
            client: realSupabaseClient,
            tableName: config.table,
            deletedField: 'is_deleted',
            updatedField: 'updated_at',
            pull: { 
              batchSize: 100, 
              modifier: (doc: any) => {
                // 🚨 THE FATAL FIX: If Supabase returns a row without an ID (like role_permissions), generate one so it doesn't crash!
                if (!doc.id) {
                    doc.id = doc.role || doc.name || doc.type || String(Date.now() + Math.random());
                }
                return { ...doc, id: String(doc.id), record_type: config.type };
              } 
            },
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