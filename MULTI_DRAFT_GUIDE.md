# Multi-Draft Support Documentation

## Overview
The form builder now supports multiple concurrent drafts of the same form per user. This allows users to work on the same form in different browser tabs or sessions without conflicts.

## How It Works

### Session-Based Draft IDs
- Each browser tab/window gets a unique session ID stored in `sessionStorage`
- Draft IDs are generated as: `{formId}_{userId}_{sessionId}`
- This allows multiple drafts of the same form to exist simultaneously

### Database Schema Changes
The `form_drafts` table now includes:
- `draft_id` (TEXT, UNIQUE): Unique identifier for each draft
- `session_id` (TEXT): Session identifier for grouping related drafts

### User Experience

#### Creating Drafts
1. **New Session**: When a user opens a form in a new tab, a new session ID is generated
2. **Auto-Save**: Form data is automatically saved with the session-specific draft ID
3. **Multiple Tabs**: Each tab maintains its own draft independently

#### Viewing Drafts
1. **Dashboard**: Shows all drafts with session information
2. **Current Tab Indicator**: Drafts from the current browser tab are highlighted
3. **Session Display**: Shows when each draft session was created
4. **Continue Links**: Each draft has its own continue link with specific draft ID

#### Draft Continuation
1. **Same Session**: Drafts auto-load in the same browser tab where they were created
2. **Cross-Session**: Users can continue any draft from the dashboard
3. **URL Parameters**: `?draft=continue&draftId=...` specifies which draft to load

## Technical Implementation

### Session Management (`src/utils/sessionManager.js`)
- `getSessionId()`: Gets or creates session ID for current tab
- `generateDraftId()`: Creates unique draft identifier
- `isDraftFromCurrentSession()`: Checks if draft belongs to current tab
- `formatSessionDisplay()`: Formats session info for UI

### FormViewer Updates
- Session-aware draft loading and saving
- Support for specific draft ID via URL parameters
- Only prompts for drafts from current session
- Clears only current session's draft on completion

### DraftManager Updates
- Groups drafts by form and session
- Shows session information and current tab indicator
- Provides continue links with specific draft IDs
- Supports deleting individual drafts

## Database Migration

Run the `draft_migration.sql` script in your Supabase SQL editor to:
1. Add `draft_id` and `session_id` columns
2. Migrate existing drafts to new format
3. Create appropriate indexes
4. Remove old uniqueness constraints

## Usage Examples

### Opening Multiple Drafts
1. Open Form A in Tab 1 → Creates Draft A1
2. Open Form A in Tab 2 → Creates Draft A2
3. Both drafts save independently
4. Dashboard shows both drafts with session info

### Continuing Drafts
1. **Same Tab**: Draft auto-loads when returning to form
2. **Different Tab**: Use "Continue" button from dashboard
3. **Shared Computer**: Select specific draft from dashboard

### Managing Drafts
1. **View All**: Dashboard shows all drafts across sessions
2. **Delete Specific**: Delete individual drafts without affecting others
3. **Complete Form**: Only current session's draft is cleared on submission

## Benefits

1. **No Conflicts**: Multiple tabs won't overwrite each other's work
2. **Flexible Workflow**: Users can work on different versions simultaneously
3. **Session Persistence**: Drafts survive browser refresh within same tab
4. **Cross-Session Access**: Can continue any draft from any tab
5. **Clear Organization**: Dashboard clearly shows which drafts belong to which sessions

## Backward Compatibility

- Existing single drafts are migrated to the new format
- Old localStorage drafts are automatically migrated to Supabase
- Legacy drafts get a `legacy_` session prefix
- All existing functionality continues to work as before
