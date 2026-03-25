import { coreDB, bootCoreDatabase, startCoreSync as _startCoreSync } from './DatabaseCore';
import { supabase } from './supabase';

export const databaseInstance = coreDB;
export const bootDatabase = bootCoreDatabase;
export const launchSync = _startCoreSync;

export const startCoreSync = async () => {
  if (coreDB) {
    return _startCoreSync(coreDB, supabase);
  }
};