import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { coreDB } from '../lib/DatabaseCore';

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
}, {} as any);

export function usePermissions() {
  const { currentUser } = useAuthStore();
  
  const [permissions, setPermissions] = useState<any>(() => {
    // 🚨 1. Normalize the role to uppercase to defeat case-sensitivity bugs
    const role = String(currentUser?.role || 'GUEST').toUpperCase();
    
    // 🚨 2. SUPERADMIN OVERRIDE: Owners and Admins are instantly granted the Master Key.
    // They never have to wait for the database to sync.
    if (role === 'OWNER' || role === 'ADMIN') {
      return { 
        ...unlockedPermissions, 
        role,
        isAdmin: role === 'ADMIN',
        isOwner: role === 'OWNER',
      };
    }

    return { ...lockedPermissions, role };
  });

  useEffect(() => {
    if (!coreDB || !currentUser?.role) return;

    const currentRole = String(currentUser.role).toUpperCase();

    // If they are an Owner/Admin, we already unlocked the UI on line 42. Skip the database query.
    if (currentRole === 'OWNER' || currentRole === 'ADMIN') return;

    // For standard Staff/Keepers, actively query the local database for their specific rulebook
    const sub = coreDB.admin_records.find({
      selector: { record_type: 'role_permission' }
    }).$.subscribe((docs) => {
      
      // Manually find the matching role to completely bypass case-sensitivity issues
      const dbPerms = docs.find(d => String(d.toJSON().role).toUpperCase() === currentRole)?.toJSON();
      
      if (dbPerms) {
        setPermissions({
          ...lockedPermissions,
          role: currentRole,
          
          isAdmin: false,
          isOwner: false,
          isSeniorKeeper: currentRole === 'SENIOR_KEEPER',
          isVolunteer: currentRole === 'VOLUNTEER',
          isStaff: true,
          
          // Map backend snake_case to frontend camelCase
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
    });

    return () => sub.unsubscribe();
  }, [currentUser]);

  return permissions;
}