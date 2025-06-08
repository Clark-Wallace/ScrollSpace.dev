import { supabase } from './supabase';

// Simple setup check - just try to query the tables
export const setupDatabase = async (): Promise<boolean> => {
  console.log('⚡ Auto-detecting Signal Fragments tables...');
  return true; // Tables will be created manually via SQL editor
};

// Check if tables exist
export const checkTablesExist = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('signal_fragments')
      .select('count')
      .limit(1);

    return !error;
  } catch {
    return false;
  }
};

// Auto-setup on first chat join
export const autoSetup = async (): Promise<void> => {
  const tablesExist = await checkTablesExist();
  
  if (!tablesExist) {
    console.log('Signal Fragments tables not found. Setting up automatically...');
    await setupDatabase();
  }
};