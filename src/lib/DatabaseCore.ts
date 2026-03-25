import { createRxDatabase, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateSupabase, RxSupabaseReplicationState } from 'rxdb/plugins/replication-supabase';
import { supabase } from './supabase';

let dbInstance: any = null;
export let coreDB: RxDatabase | null = null;

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

const makeProps = (keys: string[]) => keys.reduce((acc, key) => ({ ...acc, [key]: { type: ['string', 'number', 'boolean', 'null', 'array', 'object'] } }), {});
const baseProps = { id: { type: 'string', maxLength: 100 }, record_type: { type: 'string' }, is_deleted: { type: 'boolean' }, ...makeProps(['created_at', 'updated_at']) };

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

export const bootCoreDatabase = async (): Promise<RxDatabase> => {
  if (dbInstance) return dbInstance;

  console.log(`🛡️ [Core DB] Booting Immortal Engine...`);

  try {
    const db = await createRxDatabase({ 
      name: 'koa_manager_core_db_final',
      storage: getRxStorageDexie(), 
      multiInstance: false 
    });

    await db.addCollections({
      animals: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(animalKeys) }, required: ['id', 'record_type'] } },
      admin_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(adminKeys) }, required: ['id', 'record_type'] } },
      daily_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(dailyKeys) }, required: ['id', 'record_type'] } },
      clinical_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(clinicalKeys) }, required: ['id', 'record_type'] } },
      logistics_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(logisticsKeys) }, required: ['id', 'record_type'] } },
      staff_records: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(staffKeys) }, required: ['id', 'record_type'] } },
      maintenance_logs: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(maintenanceKeys) }, required: ['id', 'record_type'] } },
      incidents: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(incidentKeys) }, required: ['id', 'record_type'] } },
      first_aid_logs: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(firstAidKeys) }, required: ['id', 'record_type'] } },
      safety_drills: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(safetyDrillKeys) }, required: ['id', 'record_type'] } },
      operational_lists: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(listKeys) }, required: ['id', 'record_type'] } },
      tasks: { schema: { version: 0, primaryKey: 'id', type: 'object', additionalProperties: false, properties: { ...baseProps, ...makeProps(taskKeys) }, required: ['id', 'record_type'] } }
    });
    
    dbInstance = db;
    coreDB = db;
    return dbInstance;
  } catch (err) {
    console.error("Fatal Database Boot Error:", err);
    throw err;
  }
};

export const destroyCoreDatabase = async () => {
  console.log("🛑 [Core DB] Database destruction bypassed for stability.");
};

const activeReplications: RxSupabaseReplicationState<unknown>[] = [];

export const startCoreSync = async () => {
  const db = await bootCoreDatabase();

  if (!navigator.onLine) {
    console.warn('⚠️ [Core DB] Offline: Skipping Supabase replication setup.');
    return;
  }

  console.log('🔗 [Core DB] Engaging Pure Native Sync (No Proxies)...');

  activeReplications.forEach(state => state.cancel());
  activeReplications.length = 0;

  for (const [colName, configs] of Object.entries(SYNC_MAP)) {
    const collection = db.collections[colName];
    if (!collection) continue;

    for (const config of configs) {
      try {
        const state = replicateSupabase({
          collection,
          replicationIdentifier: `core_${colName}_${config.table}_sync_v6`, // 🚨 Master Reset v6
          client: supabase, // 🚨 Passed pure and untouched
          tableName: config.table,
          deletedField: 'is_deleted',
          pull: { 
            batchSize: 100, 
            modifier: (doc: any) => {
              const cleanDoc = { ...doc };
              // We can still use the native modifier to clean incoming data!
              if (!cleanDoc.id) cleanDoc.id = crypto.randomUUID(); 
              return { ...cleanDoc, id: String(cleanDoc.id), record_type: config.type, is_deleted: !!cleanDoc.is_deleted };
            } 
          },
          push: { 
            modifier: (doc: any) => {
              if (doc.record_type !== config.type) return null;
              
              const cleanDoc = { ...doc };
              
              // Stripping internal states for PostgREST compatibility
              delete cleanDoc._deleted;
              delete cleanDoc._attachments;
              delete cleanDoc._rev;
              delete cleanDoc._meta;
              delete cleanDoc.record_type; 
              
              return cleanDoc;
            } 
          },
          live: true, 
          retryTime: 5000 
        });
        
        state.error$.subscribe(err => {
           if (err?.message && !err.message.includes('Offline')) {
               console.error(`[Core Sync Error] ${config.table}:`, err);
           }
        });
        
        activeReplications.push(state);
      } catch (err) {
        console.error(`[Sync Setup Failed] ${config.table}:`, err);
      }
    }
  }
};