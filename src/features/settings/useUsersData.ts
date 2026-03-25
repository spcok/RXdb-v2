import { useState, useEffect, useCallback } from 'react';
import { coreDB, bootCoreDatabase } from '../../lib/DatabaseCore';
import { User, RolePermissionConfig } from '../../types';
import { supabase } from '../../lib/supabase';

export function useUsersData() {
  const [users, setUsers] = useState<User[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    // No-op with RxDB since it's reactive
  }, []);

  useEffect(() => {
    let isMounted = true;
    let subs: { unsubscribe: () => void }[] = [];

    const loadData = async () => {
      try {
        const db = coreDB || await bootCoreDatabase();
        if (!isMounted) return;

        const usersSub = db.admin_records.find({
          selector: {
            record_type: 'user'}
        }).$.subscribe(docs => {
          if (isMounted) {
            const rawData = docs.map(d => d.toJSON() as unknown as User).filter(d => !(d as any).is_deleted);
            const sortedData = rawData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setUsers(sortedData);
            setIsLoading(false);
          }
        });

        const rolesSub = db.admin_records.find({
          selector: {
            record_type: 'role_permission'}
        }).$.subscribe(docs => {
          if (isMounted) {
            const rolesData = docs.map(d => d.toJSON() as unknown as RolePermissionConfig).filter(d => !(d as any).is_deleted);
            const roleOrder = ['VOLUNTEER', 'KEEPER', 'SENIOR_KEEPER', 'ADMIN', 'OWNER'];
            const sortedRoles = rolesData.sort((a, b) => 
              roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
            );
            setRolePermissions(sortedRoles);
          }
        });

        subs = [usersSub, rolesSub];
      } catch (err) {
        console.error('Failed to load users data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      subs.forEach(sub => sub.unsubscribe());
    };
  }, []);

  // --- SECURE USER DELETION PIPELINE ---
  const deleteUser = async (id: string) => {
    if (!navigator.onLine) throw new Error("You must be online to delete a user.");
    
    // Invoke the secure Edge Function to destroy the Auth login and Database profile
    const { data, error } = await supabase.functions.invoke('delete-staff-account', {
      body: { userId: id }
    });

    if (error) throw new Error(`Network Error: ${error.message}`);
    if (data?.error) throw new Error(`Deletion Failed: ${data.error}`);
    
    // Also delete locally
    const db = coreDB || await bootCoreDatabase();
    const doc = await db.admin_records.findOne(id).exec();
    if (doc) {
      await doc.patch({ is_deleted: true, updated_at: new Date().toISOString() });
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const db = coreDB || await bootCoreDatabase();
    const doc = await db.admin_records.findOne(id).exec();
    if (doc) {
      await doc.patch({
        ...updates,
        updated_at: new Date().toISOString()
      });
    }
  };

  const updateRolePermissions = async (role: string, updates: Partial<RolePermissionConfig>) => {
    const db = coreDB || await bootCoreDatabase();
    const docs = await db.admin_records.find({
      selector: {
        record_type: 'role_permission',
        role: role
      }
    }).exec();
    
    if (docs.length > 0) {
      await docs[0].patch({
        ...updates,
        updated_at: new Date().toISOString()
      });
    }
  };

  return { users, rolePermissions, isLoading, deleteUser, updateUser, updateRolePermissions, refresh };
}
