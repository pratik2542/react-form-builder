import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/client';

export default function DraftManager() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = useCallback(async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        setLoading(false);
        return;
      }

      // Load drafts from Supabase
      const { data: supabaseDrafts, error } = await supabase
        .from('form_drafts')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('updated_at', { ascending: false });

      let allDrafts = [];

      if (!error && supabaseDrafts) {
        // Convert Supabase drafts to the expected format and get field counts
        const draftsWithFieldCounts = await Promise.all(
          supabaseDrafts.map(async (draft) => {
            // Get the actual form fields count
            const { data: fieldsData } = await supabase
              .from('form_fields')
              .select('id')
              .eq('form_id', draft.form_id);
            
            const totalFields = fieldsData?.length || 0;
            
            return {
              formId: draft.form_id,
              formName: draft.form_name,
              values: draft.draft_data,
              lastModified: draft.updated_at,
              savedAt: draft.updated_at,
              draftKey: `supabase_${draft.id}`,
              isSupabaseDraft: true,
              supabaseId: draft.id,
              totalFields: totalFields
            };
          })
        );
        
        allDrafts = draftsWithFieldCounts;
      } else {
        console.error('Error loading drafts from Supabase:', error);
      }

      // Also check localStorage for any existing drafts and migrate them
      const keys = Object.keys(localStorage);
      const draftPrefix = `form_draft_`;
      const userSuffix = `_${user.data.user.id}`;

      const localDrafts = [];
      keys.forEach(key => {
        if (key.startsWith(draftPrefix) && key.endsWith(userSuffix)) {
          try {
            const draftData = JSON.parse(localStorage.getItem(key));
            localDrafts.push({
              ...draftData,
              draftKey: key,
              isSupabaseDraft: false
            });
          } catch (error) {
            console.error('Error parsing local draft:', error);
          }
        }
      });

      // Migrate local drafts to Supabase
      for (const localDraft of localDrafts) {
        try {
          await migrateDraftToSupabase(localDraft);
          localStorage.removeItem(localDraft.draftKey);
        } catch (error) {
          console.error('Error migrating draft:', error);
          // Keep local draft if migration fails - add field count
          const { data: fieldsData } = await supabase
            .from('form_fields')
            .select('id')
            .eq('form_id', localDraft.formId);
          
          localDraft.totalFields = fieldsData?.length || 0;
          allDrafts.push(localDraft);
        }
      }

      // Reload from Supabase after migration
      if (localDrafts.length > 0) {
        const { data: updatedDrafts } = await supabase
          .from('form_drafts')
          .select('*')
          .eq('user_id', user.data.user.id)
          .order('updated_at', { ascending: false });

        if (updatedDrafts) {
          const draftsWithFieldCounts = await Promise.all(
            updatedDrafts.map(async (draft) => {
              // Get the actual form fields count
              const { data: fieldsData } = await supabase
                .from('form_fields')
                .select('id')
                .eq('form_id', draft.form_id);
              
              const totalFields = fieldsData?.length || 0;
              
              return {
                formId: draft.form_id,
                formName: draft.form_name,
                values: draft.draft_data,
                lastModified: draft.updated_at,
                savedAt: draft.updated_at,
                draftKey: `supabase_${draft.id}`,
                isSupabaseDraft: true,
                supabaseId: draft.id,
                totalFields: totalFields
              };
            })
          );
          
          allDrafts = draftsWithFieldCounts;
        }
      }

      setDrafts(allDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const migrateDraftToSupabase = async (localDraft) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const draftData = {
      form_id: localDraft.formId,
      user_id: user.data.user.id,
      form_name: localDraft.formName,
      draft_data: localDraft.values,
      updated_at: localDraft.lastModified || new Date().toISOString()
    };

    const { error } = await supabase
      .from('form_drafts')
      .insert(draftData);

    if (error) throw error;
  };

  const deleteDraft = async (draft) => {
    try {
      const isConfirmed = window.confirm('Are you sure you want to delete this draft?');
      if (!isConfirmed) return;

      if (draft.isSupabaseDraft) {
        // Delete from Supabase
        const { error } = await supabase
          .from('form_drafts')
          .delete()
          .eq('id', draft.supabaseId);

        if (error) {
          console.error('Error deleting draft from Supabase:', error);
          alert('Error deleting draft. Please try again.');
          return;
        }
      } else {
        // Delete from localStorage
        localStorage.removeItem(draft.draftKey);
      }

      setDrafts(drafts.filter(d => d.draftKey !== draft.draftKey));
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Error deleting draft. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getFieldCount = (draft) => {
    // Use the totalFields from the draft object if available, otherwise fall back to counting values
    return draft.totalFields || Object.keys(draft.values || {}).length;
  };

  const getFilledFieldCount = (values) => {
    if (!values) return 0;
    return Object.values(values).filter(value => {
      // Handle null, undefined, or empty string
      if (value === null || value === undefined || value === '') return false;
      
      // Handle arrays (like checkbox values)
      if (Array.isArray(value)) return value.length > 0;
      
      // Handle objects (might be used for complex field types)
      if (typeof value === 'object' && value !== null) {
        // If it's an object, check if it has any meaningful content
        const keys = Object.keys(value);
        if (keys.length === 0) return false;
        // Check if all values in the object are empty
        return keys.some(key => {
          const val = value[key];
          if (val === null || val === undefined || val === '') return false;
          if (Array.isArray(val)) return val.length > 0;
          return true;
        });
      }
      
      // Handle boolean values (for single checkboxes)
      if (typeof value === 'boolean') return value;
      
      // Handle strings that might be whitespace only
      if (typeof value === 'string') return value.trim().length > 0;
      
      // For numbers, consider 0 as a valid filled value
      if (typeof value === 'number') return true;
      
      return true;
    }).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No drafts found</h3>
        <p className="text-gray-500">Start filling out a form to create drafts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">My Drafts</h3>
        <span className="text-sm text-gray-500">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3">
        {drafts.map((draft) => (
          <div key={draft.draftKey} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{draft.formName}</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-gray-500">
                  <span>
                    {getFilledFieldCount(draft.values)} of {getFieldCount(draft)} fields filled
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>Last saved: {formatDate(draft.lastModified)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:ml-4">
                <Link
                  to={`/view/${draft.formId}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Continue
                </Link>
                <button
                  onClick={() => deleteDraft(draft)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs text-gray-500">
                  {Math.round((getFilledFieldCount(draft.values) / Math.max(getFieldCount(draft), 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(getFilledFieldCount(draft.values) / Math.max(getFieldCount(draft), 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
