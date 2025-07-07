# Troubleshooting Form Submission Issues

## Quick Setup Checklist

### 1. Environment Variables
Create a `.env.local` file in the root directory with your Supabase credentials:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find these values:**
1. Go to your Supabase project dashboard
2. Click on "Settings" > "API"
3. Copy the "Project URL" and "anon/public" key

### 2. Database Table Setup
The `form_submissions` table needs to be created in your Supabase database.

**Option A:** Run the provided SQL script
1. Open Supabase SQL Editor
2. Copy and paste the contents of `create_submissions_table.sql`
3. Click "RUN"

**Option B:** Manual table creation
```sql
-- Create the form_submissions table
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES auth.users(id),
    submission_data JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON public.form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at);

-- Enable Row Level Security
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own submissions" ON public.form_submissions
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view their own submissions" ON public.form_submissions
    FOR SELECT USING (auth.uid() = submitted_by);

-- Allow form creators to view submissions
CREATE POLICY "Form creators can view submissions" ON public.form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_submissions.form_id 
            AND forms.created_by = auth.uid()
        )
    );
```

### 3. Authentication
Make sure you're logged in to the application before trying to submit forms.

### 4. Debug Information
The debug panel in the FormViewer will show:
- ✅ Supabase connection status
- ✅ Authentication status
- ✅ Table existence
- ✅ Current user info

### Common Issues and Solutions

**"Error submitting form: {}"**
- This usually means the `form_submissions` table doesn't exist
- Check the debug panel for table status
- Run the SQL script to create the table

**"Authentication error"**
- Log out and log back in
- Check if your session has expired

**"Unknown error occurred"**
- Check browser console for detailed error messages
- Verify environment variables are set correctly
- Check Supabase project is active and accessible

### Testing the Fix
1. Restart your development server after adding environment variables
2. Check the debug panel shows all green checkmarks
3. Try submitting a form
4. Check the Supabase dashboard > Table Editor > form_submissions for your data

### Removing Debug Panel
Once everything is working, you can remove the debug panel by:
1. Removing the `<DebugSupabase />` component from FormViewer.jsx
2. Removing the import: `import DebugSupabase from './DebugSupabase';`
