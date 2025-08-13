# Database Setup Instructions

## Issue: Missing Database Columns

If you're seeing an error like "Could not find the 'submitter_name' column", it means your database is missing some optional columns that enable advanced features.

## Quick Fix

**The form will work immediately** - it will automatically fall back to basic functionality without these columns.

## To Enable Full Features

Run the SQL commands in `ADD_SUBMITTER_NAME_COLUMN.sql` in your Supabase SQL editor:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Run the SQL
```sql
-- Add submitter_name column to store the name of the person who filled the form
ALTER TABLE "public"."form_submissions" 
ADD COLUMN IF NOT EXISTS "submitter_name" TEXT;

-- Add field_metadata column to store field information at submission time
ALTER TABLE "public"."form_submissions" 
ADD COLUMN IF NOT EXISTS "field_metadata" JSONB;

-- Add comments and index
COMMENT ON COLUMN "public"."form_submissions"."submitter_name" IS 'Name of the person who submitted the form (captured before form display)';
COMMENT ON COLUMN "public"."form_submissions"."field_metadata" IS 'Field information as it was when the form was submitted (preserves form structure)';
CREATE INDEX IF NOT EXISTS "idx_form_submissions_submitter_name" ON "public"."form_submissions" ("submitter_name");
```

### Step 3: Click "Run"

## What These Columns Enable

- **submitter_name**: Shows who filled each form in the submissions list
- **field_metadata**: Preserves field names and structure, so old submissions show correct field labels even if you change the form later

## Current Status

✅ **Form submissions work** (with basic data)  
⚠️ **Missing features**: Submitter names and field preservation  
🔧 **Fix**: Run the SQL script above  

The application is designed to work gracefully with or without these columns!
