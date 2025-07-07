# Deploy to Vercel

## Prerequisites
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm i -g vercel`
3. Have your code in a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect it's a React app
5. Configure environment variables (see below)
6. Click "Deploy"

### Option 2: Deploy via CLI
1. Run `vercel login` to authenticate
2. Run `vercel` in your project directory
3. Follow the prompts
4. Set up environment variables via dashboard

## Environment Variables Setup
In your Vercel project dashboard, go to Settings → Environment Variables and add:

1. **REACT_APP_SUPABASE_URL**
   - Value: `https://tfnirtujdtspszijlzuw.supabase.co`

2. **REACT_APP_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbmlydHVqZHRzcHN6aWpsenV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzAyNDMsImV4cCI6MjA2NzA0NjI0M30.eDzMrARQyz-5sEoSnX2JUs0FN8CuR2NNFSGgoKpNiBU`

3. **REACT_APP_GROQ_TOKEN**
   - Value: `***REMOVED***`

## Important Notes
- Make sure your Supabase database has the required tables:
  - `forms`
  - `form_fields`
  - `form_submissions`
  - `form_drafts`
- Run the SQL schema from `form_drafts_table.sql` in your Supabase SQL editor
- Ensure Row Level Security (RLS) is properly configured in Supabase

## Custom Domain (Optional)
1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed by Vercel

## Automatic Deployments
Once connected to Git, Vercel will automatically deploy:
- Main branch → Production
- Other branches → Preview deployments

Your app will be available at: `https://your-project-name.vercel.app`
