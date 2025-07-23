// Auto-migration utility for draft system
import { supabase } from '../supabase/client';

export const checkAndMigrateDraftSchema = async () => {
  try {
    console.log('Checking draft schema...');
    
    // Test if new columns exist by trying to select them
    const { error } = await supabase
      .from('form_drafts')
      .select('draft_id, session_id')
      .limit(1);
    
    if (error && (error.message?.includes('draft_id') || error.message?.includes('session_id') || error.code === '42703')) {
      console.log('New draft columns not found, schema needs migration');
      return false; // Schema needs migration
    } else {
      console.log('Draft schema is up to date');
      return true; // Schema is good
    }
  } catch (error) {
    console.error('Error checking draft schema:', error);
    return false;
  }
};

export const showMigrationInstructions = () => {
  const migrationSQL = `
-- Add new columns to form_drafts table
ALTER TABLE form_drafts 
ADD COLUMN IF NOT EXISTS draft_id TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create unique index on draft_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_drafts_draft_id 
ON form_drafts(draft_id);

-- Create index on session_id for better performance
CREATE INDEX IF NOT EXISTS idx_form_drafts_session_id 
ON form_drafts(session_id);

-- Migrate existing drafts to new format
UPDATE form_drafts 
SET 
  draft_id = 'legacy_' || form_id || '_' || user_id || '_' || EXTRACT(EPOCH FROM updated_at)::bigint,
  session_id = 'legacy'
WHERE draft_id IS NULL;

-- Optional: Remove old unique constraint if it exists
-- ALTER TABLE form_drafts DROP CONSTRAINT IF EXISTS form_drafts_form_id_user_id_key;
`;

  console.log('='.repeat(80));
  console.log('🚀 MULTI-DRAFT SUPPORT AVAILABLE!');
  console.log('='.repeat(80));
  console.log('To enable multiple drafts per form, run this SQL in your Supabase SQL editor:');
  console.log('');
  console.log(migrationSQL);
  console.log('='.repeat(80));
  console.log('⚠️  Currently running in SINGLE DRAFT mode (only one draft per form per user)');
  console.log('✨ After migration: Users can create multiple drafts for the same form!');
  console.log('='.repeat(80));
  
  // Show an alert to make it more prominent
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      alert(`🚀 MULTI-DRAFT FEATURE AVAILABLE!\n\nCurrently you can only save one draft per form.\n\nTo enable multiple drafts per form, please run the database migration SQL in your Supabase SQL editor.\n\nCheck the browser console for the SQL script.`);
    }, 2000);
  }
};

export const initializeDraftSystem = async () => {
  const isSchemaUpToDate = await checkAndMigrateDraftSchema();
  
  if (!isSchemaUpToDate) {
    showMigrationInstructions();
  }
  
  return isSchemaUpToDate;
};
