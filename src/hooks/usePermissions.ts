import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { coreDB, bootCoreDatabase } from '../lib/DatabaseCore';

// The locked-down default for guests and loading states
const lockedPermissions = {
  isAdmin: false, isOwner: false, isSeniorKeeper: false, isVolunteer: false, isStaff: false,
  view_animals: false, add_animals: false, edit_animals: false, archive_animals: false,
  view_daily_logs: false, create_daily_logs: false, edit_daily_logs: false,
  view_tasks: false, complete_tasks: false, manage_tasks: false,
  view_daily_rounds: false, log_daily_rounds: false,
  view_medical: false, add_clinical_notes: false, prescribe_medications: false, administer_medications: false, manage_quarantine: false,
  view_movements: false, log_internal_movements: false, manage_external_transfers: false,
  view_incidents: false, report_incidents: false, manage_incidents: false,
  view_maintenance: false, report_maintenance: false, resolve_maintenance: false,
  view_safety_drills: false, view_first_aid: false,
  submit_timesheets: false, manage_all_timesheets: false,
  request_holidays: false, approve_holidays: false,
  view_missing_records: false, manage_zla_documents: false, generate_reports: false,
  view_settings: false, manage_users: false, manage_roles: false,
  canViewAnimals: false, canEditAnimals: false, canViewMedical: false, canEditMedical: false, 
  canViewReports: false, canManageStaff: false, canEditSettings: false, canViewSettings: false, 
  canGenerateReports: false, canManageUsers: false, canViewMovements: false, canEditMovements: false,
};

// The absolute Master Key for Owners and Admins
const unlockedPermissions = Object.keys(lockedPermissions).reduce((acc, key) => {
  acc[key] = true;
  return acc;
}, {} as Record<string, boolean>);

export function usePermissions() {
  const { currentUser } = useAuthStore();
  
  const [permissions, setPermissions] = useState<Record<string, boolean | string>>(() => {
    // Look in multiple places for the role just in case the profile fetch failed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawRole = (currentUser as any)?.role || (currentUser as any)?.user_metadata?.role || 'GUEST';
    const role = String(rawRole).toUpperCase();
    
    // 🔥 MASTER KEY BYPASS: Owners inherently inherit ALL lower role privileges
    if (role === 'OWNER' || role === 'ADMIN') {
      return { 
        ...unlockedPermissions, 
        role, 
        isAdmin: true, // Forces true for both Owners AND Admins
        isOwner: role === 'OWNER',
        isSeniorKeeper: true,
        isVolunteer: false,
        isStaff: true
      };
    }

    return { ...lockedPermissions, role };
  });

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initializePermissions = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawRole = (currentUser as any)?.role || (currentUser as any)?.user_metadata?.role;
      if (!rawRole) return;

      const currentRole = String(rawRole).toUpperCase();
      
      // If Admin or Owner, the state is already unlocked dynamically above. Skip DB query.
      if (currentRole === 'OWNER' || currentRole === 'ADMIN') {
          console.log(`🔓 [Permissions] Master Key granted for ${currentRole}`);
          return;
      }

      try {
        // Await the Immortal Database lock. Stops silent failures on fast mounts.
        const db = coreDB || await bootCoreDatabase();

        if (!isMounted) return;

        // Actively listen to the role_permissions table in RxDB
        subscription = db.admin_records.find({
          selector: { record_type: 'role_permission' }
        }).$.subscribe((docs) => {
          
          console.log(`🕵️ [Permissions] Target Role: ${currentRole}`);
          console.log(`🕵️ [Permissions] Rules found in Local DB: ${docs.length}`);
          
          // Match the role dynamically
          const dbPerms = docs.find(d => String(d.toJSON().role).toUpperCase() === currentRole)?.toJSON();
          
          if (dbPerms && isMounted) {
            console.log(`✅ [Permissions] Successfully mapped rulebook for ${currentRole}`);
            setPermissions({
              ...lockedPermissions,
              role: currentRole,
              isAdmin: false,
              isOwner: false,
              isSeniorKeeper: currentRole === 'SENIOR_KEEPER',
              isVolunteer: currentRole === 'VOLUNTEER',
              isStaff: true,
              
              // Map backend snake_case to frontend camelCase overrides
              canViewAnimals: dbPerms.view_animals || false,
              canEditAnimals: dbPerms.edit_animals || false,
              canViewMedical: dbPerms.view_medical || false,
              canEditMedical: dbPerms.edit_medical || false,
              canViewReports: dbPerms.generate_reports || false,
              canManageStaff: dbPerms.manage_users || false,
              canEditSettings: dbPerms.view_settings || false,
              canViewSettings: dbPerms.view_settings || false,
              canGenerateReports: dbPerms.generate_reports || false,
              canManageUsers: dbPerms.manage_users || false,
              canViewMovements: dbPerms.view_movements || false,
              canEditMovements: dbPerms.log_internal_movements || false,
              
              ...dbPerms
            });
          } else {
             console.warn(`❌ [Permissions] Local DB is missing the rulebook for ${currentRole}.`);
          }
        });
      } catch (err) {
        console.error('❌ [Permissions] Failed to sync role permissions from cache:', err);
      }
    };

    initializePermissions();

    // Cleanup the RxDB subscription when the component unmounts
    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [currentUser]);

  return permissions;
}