import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/index';

export function usePermissions() {
  const { currentUser } = useAuthStore();

  const permissions = useMemo(() => {
    // 🚨 MASTER KEY: Bypass all security doors during the blank slate test
    return {
      isAdmin: true,
      isOwner: true,
      isSeniorKeeper: true,
      isVolunteer: true,
      isStaff: true,
      view_animals: true, add_animals: true, edit_animals: true, archive_animals: true,
      view_daily_logs: true, create_daily_logs: true, edit_daily_logs: true,
      view_tasks: true, complete_tasks: true, manage_tasks: true,
      view_daily_rounds: true, log_daily_rounds: true,
      view_medical: true, add_clinical_notes: true, prescribe_medications: true, administer_medications: true, manage_quarantine: true,
      view_movements: true, log_internal_movements: true, manage_external_transfers: true,
      view_incidents: true, report_incidents: true, manage_incidents: true,
      view_maintenance: true, report_maintenance: true, resolve_maintenance: true,
      view_safety_drills: true, view_first_aid: true,
      submit_timesheets: true, manage_all_timesheets: true,
      request_holidays: true, approve_holidays: true,
      view_missing_records: true, manage_zla_documents: true, generate_reports: true,
      view_settings: true, manage_users: true, manage_roles: true,
      canViewAnimals: true, canEditAnimals: true, canViewMedical: true, canEditMedical: true, 
      canViewReports: true, canManageStaff: true, canEditSettings: true, canViewSettings: true, 
      canGenerateReports: true, canManageUsers: true, canViewMovements: true, canEditMovements: true,
      role: (currentUser?.role as UserRole) || UserRole.ADMIN
    };
  }, [currentUser]);

  return permissions;
}
