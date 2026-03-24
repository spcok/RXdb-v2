import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { coreDB, bootCoreDatabase } from '../lib/DatabaseCore';

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

const unlockedPermissions = Object.keys(lockedPermissions).reduce((acc, key) => {
  acc[key] = true;
  return acc;
}, {} as any);

export function usePermissions() {
  const { currentUser } = useAuthStore();
  
  const [permissions, setPermissions] = useState<any>(() => {
    const rawRole = currentUser?.role || currentUser?.user_metadata?.role || 'GUEST';
    const role = String(rawRole).toUpperCase();
    
    // Master Key Bypass
    if (role === 'OWNER' || role === 'ADMIN') {
      return { ...unlockedPermissions, role, isAdmin: role === 'ADMIN', isOwner: role === 'OWNER' };
    }
    return { ...lockedPermissions, role };
  });

  useEffect(() => {
    let isMounted = true;
    let subscription: any;

    const initializePermissions = async () => {
      const rawRole = currentUser?.role || currentUser?.user_metadata?.role;
      if (!rawRole) return;

      const currentRole = String(rawRole).toUpperCase();
      
      // If Admin, the state is already unlocked on line 38. Skip DB query.
      if (currentRole === 'OWNER' || currentRole === 'ADMIN') {
          console.log(`🔓 [Permissions] Master Key granted for ${currentRole}`);
          return;
      }

      try {
        // Force React to wait for the database to boot
        const db = coreDB || await bootCoreDatabase();
        if (!isMounted) return;

        subscription = db.admin_records.find({
          selector: { record_type: 'role_permission' }
        }).$.subscribe((docs) => {
          
          console.log(`🕵️ [Permissions] Target Role: ${currentRole}`);
          console.log(`🕵️ [Permissions] Rules found in Local DB: ${docs.length}`);
          
          const dbPerms = docs.find(d => String(d.toJSON().role).toUpperCase() === currentRole)?.toJSON();
          
          if (dbPerms) {
            console.log(`✅ [Permissions] Successfully applied rulebook for ${currentRole}`);
            if (isMounted) {
              setPermissions({
                ...lockedPermissions,
                role: currentRole,
                isAdmin: false,
                isOwner: false,
                isSeniorKeeper: currentRole === 'SENIOR_KEEPER',
                isVolunteer: currentRole === 'VOLUNTEER',
                isStaff: true,
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
            }
          } else {
             console.warn(`❌ [Permissions] Local DB is missing the rulebook for ${currentRole}. Check Supabase data!`);
          }
        });
      } catch (error) {
        console.error('❌ [Permissions] Failed to sync role permissions from cache:', error);
      }
    };

    initializePermissions();

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [currentUser]);

  return permissions;
}