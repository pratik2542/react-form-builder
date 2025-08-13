-- SQL commands to allow public read access to forms and form fields
-- Run these in your Supabase SQL editor

-- Allow public read access to forms table
CREATE POLICY "Allow public read access to forms" ON "public"."forms"
    FOR SELECT USING (true);

-- Allow public read access to form_fields table  
CREATE POLICY "Allow public read access to form_fields" ON "public"."form_fields"
    FOR SELECT USING (true);

-- Allow public insert access to form_submissions table (for anonymous submissions)
CREATE POLICY "Allow public insert to form_submissions" ON "public"."form_submissions"
    FOR INSERT WITH CHECK (true);

-- Optional: Allow public insert/update access to form_drafts table (for anonymous draft saving)
CREATE POLICY "Allow public insert to form_drafts" ON "public"."form_drafts"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update own drafts" ON "public"."form_drafts"
    FOR UPDATE USING (true) WITH CHECK (true);

-- Note: These policies allow public access. If you want more restrictive access,
-- you can modify the conditions. For example:
-- - Only allow read access to published forms: USING (status = 'published')
-- - Only allow access to specific forms: USING (is_public = true)
