import { useState, useEffect } from 'react';
import { OrgProfileSettings } from '../../types';
import { bootCoreDatabase } from '../../lib/DatabaseCore';

const DEFAULT_SETTINGS: OrgProfileSettings = {
  id: 'profile',
  org_name: 'Kent Owl Academy',
  logo_url: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  zla_license_number: '',
  official_website: '',
  adoption_portal: '',
};

export function useOrgSettings() {
  const [settings, setSettings] = useState<OrgProfileSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sub: { unsubscribe: () => void } | null = null;

    const loadData = async () => {
      try {
        const db = await bootCoreDatabase();
        if (!isMounted) return;

        sub = db.admin_records.findOne('profile').$.subscribe(doc => {
          if (isMounted && doc) {
            setSettings(doc.toJSON() as unknown as OrgProfileSettings);
            setIsLoading(false);
          } else if (isMounted) {
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load org settings:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  const saveSettings = async (newSettings: OrgProfileSettings) => {
    const db = await bootCoreDatabase();
    await db.admin_records.upsert({
      ...newSettings,
      id: 'profile',
      record_type: 'org_profile',
      updated_at: new Date().toISOString()
    });
  };

  return { settings, isLoading, saveSettings };
}
