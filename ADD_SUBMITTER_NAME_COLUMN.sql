-- SQL commands to add missing columns to form_submissions table
-- Run these in your Supabase SQL editor to enable full functionality

-- 1. Add submitter_name column to store the name of the person who filled the form
ALTER TABLE "public"."form_submissions" 
ADD COLUMN IF NOT EXISTS "submitter_name" TEXT;

-- 2. Add field_metadata column to store field information at submission time
ALTER TABLE "public"."form_submissions" 
ADD COLUMN IF NOT EXISTS "field_metadata" JSONB;

-- 3. Add comments to the columns for documentation
COMMENT ON COLUMN "public"."form_submissions"."submitter_name" IS 'Name of the person who submitted the form (captured before form display)';
COMMENT ON COLUMN "public"."form_submissions"."field_metadata" IS 'Field information as it was when the form was submitted (preserves form structure)';

-- 4. Create an index on submitter_name for better query performance
CREATE INDEX IF NOT EXISTS "idx_form_submissions_submitter_name" ON "public"."form_submissions" ("submitter_name");

-- Note: These columns are optional and the application will handle cases where they don't exist
-- The form will still work without these columns, but some features will be limited:
-- - Without submitter_name: Won't show who submitted each form
-- - Without field_metadata: Won't preserve original field names for old submissions
