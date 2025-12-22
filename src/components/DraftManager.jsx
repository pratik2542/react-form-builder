import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { isDraftFromCurrentSession, formatSessionDisplay } from '../utils/sessionManager';
import { initializeDraftSystem } from '../utils/draftMigration';

export default function DraftManager() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadDrafts = useCallback(async () => {
    try {
      // Initialize draft system first
      await initializeDraftSystem();
      
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
            
            // Handle both new and legacy draft formats
            const draftId = draft.draft_id || draft.id.toString(); // Use database ID for legacy mode
            const sessionId = draft.session_id || 'legacy';
            
            return {
              formId: draft.form_id,
              formName: draft.form_name,
              values: draft.draft_data,
              lastModified: draft.updated_at,
              savedAt: draft.updated_at,
              draftKey: `supabase_${draft.id}`,
              draftId: draftId,
              sessionId: sessionId,
              isSupabaseDraft: true,
              supabaseId: draft.id,
              totalFields: totalFields,
              isCurrentSession: draftId ? isDraftFromCurrentSession(draftId) : false,
              sessionDisplay: sessionId && sessionId !== 'legacy' ? formatSessionDisplay(sessionId) : 'Legacy Draft'
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

  // Auto-refresh drafts when expanded to show live updates
  useEffect(() => {
    if (isExpanded) {
      const refreshInterval = setInterval(() => {
        loadDrafts();
      }, 3000); // Refresh every 3 seconds when expanded

      return () => clearInterval(refreshInterval);
    }
  }, [isExpanded, loadDrafts]);

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
    // Count unique filled fields to avoid duplicates
    const filledFields = new Set();
    
    Object.entries(values).forEach(([fieldId, value]) => {
      if (isFieldFilled(value)) {
        filledFields.add(fieldId);
      }
    });
    
    return filledFields.size;
  };

  const isFieldFilled = (value) => {
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
  };

  if (loading) {
    return null; // Don't show loading state for drafts to reduce visual clutter
  }

  if (drafts.length === 0) {
    return null; // Don't show anything if no drafts exist
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/80 via-slate-800/80 to-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-600/50 overflow-hidden relative">
      {/* Neon accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
      
      {/* Compact Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-transparent hover:bg-white/5 transition-all duration-200 flex items-center justify-between relative z-10"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">My Drafts</h3>
            <p className="text-xs text-gray-400">{drafts.length} saved draft{drafts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Quick preview of recent drafts when collapsed */}
          {!isExpanded && drafts.length > 0 && (
            <div className="hidden sm:flex items-center space-x-1">
              {drafts.slice(0, 2).map((draft, index) => (
                <div key={index} className="text-xs text-gray-300 bg-gray-700/50 rounded px-2 py-1 border border-gray-600/50">
                  {draft.formName.length > 15 ? `${draft.formName.substring(0, 15)}...` : draft.formName}
                </div>
              ))}
              {drafts.length > 2 && (
                <div className="text-xs text-gray-400">+{drafts.length - 2} more</div>
              )}
            </div>
          )}
          
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-600/50 relative z-10">
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {/* Group drafts by form */}
            {(() => {
              const groupedDrafts = drafts.reduce((groups, draft) => {
                const formName = draft.formName;
                if (!groups[formName]) {
                  groups[formName] = [];
                }
                groups[formName].push(draft);
                return groups;
              }, {});

              return Object.entries(groupedDrafts).map(([formName, formDrafts]) => (
                <div key={formName} className="border border-gray-600/50 rounded-xl overflow-hidden bg-gray-800/30">
                  {/* Form Header */}
                  <div className="bg-gray-700/30 px-3 py-2 border-b border-gray-600/50">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-200 text-sm">{formName}</h5>
                      <span className="text-xs text-gray-400">{formDrafts.length} draft{formDrafts.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  {/* Draft List */}
                  <div className="divide-y divide-gray-600/30">
                    {formDrafts.map((draft, index) => (
                      <div key={draft.draftKey} className={`p-3 transition-colors ${
                        draft.isCurrentSession ? 'bg-cyan-900/20 hover:bg-cyan-900/30' : 'hover:bg-white/5'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-300">
                                Draft #{index + 1}
                              </span>
                              {draft.isCurrentSession && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Current Tab
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-gray-400">
                              <span>
                                {getFilledFieldCount(draft.values)} of {getFieldCount(draft)} fields filled
                              </span>
                              <span className="hidden sm:inline text-gray-600">•</span>
                              <span>Last saved: {formatDate(draft.lastModified)}</span>
                              {draft.sessionDisplay && !draft.isCurrentSession && (
                                <>
                                  <span className="hidden sm:inline text-gray-600">•</span>
                                  <span>{draft.sessionDisplay}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:ml-3">
                            <Link
                              to={`/view/${draft.formId}?draft=continue&draftId=${encodeURIComponent(draft.draftId || '')}`}
                              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center shadow-lg shadow-cyan-500/20"
                            >
                              Continue
                            </Link>
                            <button
                              onClick={() => deleteDraft(draft)}
                              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center shadow-lg shadow-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Compact Progress Bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              {Math.round((getFilledFieldCount(draft.values) / Math.max(getFieldCount(draft), 1)) * 100)}% complete
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
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
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
