import { useState, useEffect } from 'react';
import { OrgProfileSettings } from '../../types';

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
  const [isLoading] = useState(false);

  useEffect(() => {
    // Mocked settings fetch - no action needed as state is initialized with defaults
  }, []);

  const saveSettings = async (newSettings: OrgProfileSettings) => {
    console.log("🏢 [OrgSettings] Mock save profile:", newSettings);
    setSettings(newSettings);
  };

  return { settings, isLoading, saveSettings };
}
