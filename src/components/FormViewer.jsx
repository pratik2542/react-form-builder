import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { getSessionId, generateDraftId } from '../utils/sessionManager';
import { initializeDraftSystem } from '../utils/draftMigration';


export default function FormViewer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDraftContinue = searchParams.get('draft') === 'continue';
  const specificDraftId = searchParams.get('draftId');
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [conditionalLogic, setConditionalLogic] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isDraftPanelExpanded, setIsDraftPanelExpanded] = useState(false);
  
  // Track the current draft ID for this session
  const [currentDraftId, setCurrentDraftId] = useState(null);

  useEffect(() => {
    const fetchFormAndFields = async () => {
      try {
        // Initialize draft system and check schema
        await initializeDraftSystem();
        
        // Test Supabase connection first
        console.log('Testing Supabase connection...');
        const { error: connectionError } = await supabase
          .from('forms')
          .select('count')
          .limit(1);
        
        if (connectionError) {
          console.error('Supabase connection error:', connectionError);
          alert('Unable to connect to database. Please check your configuration.');
          return;
        }
        
        console.log('Supabase connection successful');
        
        // Test if form_submissions table exists
        console.log('Testing form_submissions table...');
        const { error: tableError } = await supabase
          .from('form_submissions')
          .select('count')
          .limit(1);
          
        if (tableError) {
          console.warn('form_submissions table check failed:', tableError);
          if (tableError.message && (
            tableError.message.includes('relation "public.form_submissions" does not exist') ||
            tableError.message.includes('table "form_submissions" does not exist') ||
            tableError.code === '42P01'
          )) {
            console.warn('form_submissions table does not exist - submissions will be stored locally');
          }
        } else {
          console.log('form_submissions table exists and is accessible');
        }

        // Fetch form details
        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();
        
        if (!formError) {
          setForm(formData);
          
          // Load conditional logic if it exists (handle missing column gracefully)
          if (formData.conditional_logic) {
            try {
              const logic = JSON.parse(formData.conditional_logic);
              setConditionalLogic(logic);
            } catch (e) {
              console.warn('Failed to parse conditional logic:', e);
              setConditionalLogic([]);
            }
          } else {
            setConditionalLogic([]);
          }
          
          console.log('Form loaded:', formData);
        } else {
          console.error('Form loading error:', formError);
        }

        // Fetch form fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('form_fields')
          .select('*')
          .eq('form_id', formId)
          .order('display_order');
        
        if (!fieldsError) {
          // Process fields to handle options properly and assign consistent IDs
          const processedFields = fieldsData.map((field, index) => {
            const processedField = {
              ...field,
              id: `field_${index}`,  // Use consistent field ID format
              db_id: field.id,       // Keep original database ID
              // Convert options from JSON string to array if needed
              options: (() => {
                if (!field.options) return [];
                if (Array.isArray(field.options)) return field.options;
                try {
                  const parsed = JSON.parse(field.options);
                  return parsed;
                } catch (e) {
                  console.warn(`Failed to parse options for field ${field.label}:`, field.options);
                  return [];
                }
              })()
            };
            
            return processedField;
          });
          setFields(processedFields);
          console.log('Fields loaded:', processedFields);
        } else {
          console.error('Fields loading error:', fieldsError);
        }
      } catch (error) {
        console.error('Error fetching form:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormAndFields();
  }, [formId]);

  // Evaluate conditional logic
  const evaluateCondition = (condition, currentValues) => {
    const sourceValue = currentValues[condition.sourceField];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return sourceValue === conditionValue;
      case 'not_equals':
        return sourceValue !== conditionValue;
      case 'contains':
        return typeof sourceValue === 'string' && sourceValue.includes(conditionValue);
      case 'not_contains':
        return typeof sourceValue === 'string' && !sourceValue.includes(conditionValue);
      case 'starts_with':
        return typeof sourceValue === 'string' && sourceValue.startsWith(conditionValue);
      case 'ends_with':
        return typeof sourceValue === 'string' && sourceValue.endsWith(conditionValue);
      case 'is_empty':
        return !sourceValue || sourceValue === '' || (Array.isArray(sourceValue) && sourceValue.length === 0);
      case 'is_not_empty':
        return sourceValue && sourceValue !== '' && (!Array.isArray(sourceValue) || sourceValue.length > 0);
      case 'greater_than':
        return parseFloat(sourceValue) > parseFloat(conditionValue);
      case 'less_than':
        return parseFloat(sourceValue) < parseFloat(conditionValue);
      case 'greater_equal':
        return parseFloat(sourceValue) >= parseFloat(conditionValue);
      case 'less_equal':
        return parseFloat(sourceValue) <= parseFloat(conditionValue);
      default:
        return false;
    }
  };

  const getFieldVisibility = (fieldId) => {
    // Start with visible by default
    let isVisible = true;
    let isRequired = fields.find(f => f.id === fieldId)?.is_required || false;

    // Apply conditional logic
    conditionalLogic.forEach(condition => {
      if (condition.targetField === fieldId) {
        const conditionMet = evaluateCondition(condition, values);
        
        if (conditionMet) {
          switch (condition.action) {
            case 'show':
              isVisible = true;
              break;
            case 'hide':
              isVisible = false;
              break;
            case 'require':
              isRequired = true;
              break;
            case 'optional':
              isRequired = false;
              break;
            default:
              // No action for unknown condition actions
              break;
          }
        }
      }
    });

    return { isVisible, isRequired };
  };

  // Save draft to Supabase
  const saveDraftToSupabase = useCallback(async (draftValues, formName, isMigration = false, isAutoSave = false) => {
    try {
      // Remove user check for public access
      // const user = await supabase.auth.getUser();
      // if (!user.data.user) return false;
      const user = { data: { user: { id: 'public-user' } } }; // Use a dummy user id for public submissions

      // For manual saves, don't save if there are no actual values
      if (!isAutoSave && (!draftValues || Object.keys(draftValues).length === 0)) {
        console.log('No values to save in draft (manual save)');
        return false;
      }

      // For manual saves, check if the values are not just empty strings
      if (!isAutoSave) {
        const hasActualValues = Object.values(draftValues || {}).some(value => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return value !== null && value !== undefined && value !== '';
        });

        if (!hasActualValues) {
          console.log('No meaningful values to save in draft (manual save)');
          return false;
        }
      }

      // For auto-saves, always save the current state (even if empty) to preserve draft
      console.log('Saving draft:', { draftValues, isAutoSave, isMigration });

      // Generate session-based draft ID
      const sessionId = getSessionId();
      let draftId;
      
      if (specificDraftId) {
        // Use the specific draft ID if continuing an existing draft
        draftId = specificDraftId;
        setCurrentDraftId(draftId);
      } else if (currentDraftId) {
        // Use the existing current draft ID for this session
        draftId = currentDraftId;
      } else {
        // Use standard session-based draft ID and store it
        draftId = generateDraftId(formId, user.data.user.id, sessionId);
        setCurrentDraftId(draftId);
      }

      console.log('Saving draft:', { draftId, specificDraftId, isAutoSave, isMigration, currentDraftId });
      let useNewSchema = true;
      try {
        const { error: schemaTestError } = await supabase
          .from('form_drafts')
          .select('draft_id, session_id')
          .limit(1);
        
        if (schemaTestError && (schemaTestError.message?.includes('draft_id') || schemaTestError.message?.includes('session_id'))) {
          useNewSchema = false;
          console.log('🔄 Using LEGACY draft schema (single draft per form per user)');
          console.log('💡 To enable multi-draft support, run the database migration SQL from the console');
        }
      } catch (e) {
        useNewSchema = false;
      }

      let draftData, existingDraft;
      
      if (useNewSchema) {
        // New schema with session support - allow multiple drafts per form
        console.log('✨ Using NEW draft schema (multiple drafts per form supported)');
        draftData = {
          draft_id: draftId,
          form_id: formId,
          user_id: user.data.user.id,
          session_id: sessionId,
          form_name: formName || form?.name || 'Untitled Form',
          draft_data: draftValues,
          updated_at: new Date().toISOString()
        };

        console.log('Draft data to save (NEW schema):', { draftId, draftData });

        // Only look for existing draft if we're continuing a specific draft
        if (specificDraftId) {
          const { data: existingDrafts } = await supabase
            .from('form_drafts')
            .select('id')
            .eq('draft_id', specificDraftId)
            .limit(1);
          existingDraft = existingDrafts && existingDrafts.length > 0 ? existingDrafts[0] : null;
        } else {
          // For auto-saves, try to find draft for current session only
          const { data: existingDrafts } = await supabase
            .from('form_drafts')
            .select('id')
            .eq('draft_id', draftId)
            .limit(1);
          existingDraft = existingDrafts && existingDrafts.length > 0 ? existingDrafts[0] : null;
        }
      } else {
        // Legacy schema (single draft per form per user)
        console.log('⚠️  Using LEGACY draft schema (only one draft per form per user)');
        draftData = {
          form_id: formId,
          user_id: user.data.user.id,
          form_name: formName || form?.name || 'd Form',
          draft_data: draftValues,
          updated_at: new Date().toISOString()
        };

        console.log('Draft data to save (LEGACY schema):', { draftData });
        console.log('⚠️  LIMITATION: Only one draft per form per user in legacy mode');

        // Try to find existing draft for this form/user combination
        const { data: existingDrafts } = await supabase
          .from('form_drafts')
          .select('id')
          .eq('form_id', formId)
          .eq('user_id', user.data.user.id)
          .limit(1);

        existingDraft = existingDrafts && existingDrafts.length > 0 ? existingDrafts[0] : null;
      }

      if (existingDraft) {
        // Update existing draft
        console.log('Updating existing draft:', existingDraft.id, 'with draftId:', draftId);
        const { error } = await supabase
          .from('form_drafts')
          .update(draftData)
          .eq('id', existingDraft.id);

        if (error) {
          // If the new columns don't exist, try with old format
          if (error.message && (error.message.includes('draft_id') || error.message.includes('session_id'))) {
            console.log('New draft columns not found, using legacy format');
            const legacyData = {
              form_id: formId,
              user_id: user.data.user.id,
              form_name: formName || form?.name || 'Untitled Form',
              draft_data: draftValues,
              updated_at: new Date().toISOString()
            };
            
            // Use the old approach - update by form_id and user_id
            const { error: legacyError } = await supabase
              .from('form_drafts')
              .update(legacyData)
              .eq('form_id', formId)
              .eq('user_id', user.data.user.id);
            
            if (legacyError) throw legacyError;
          } else {
            throw error;
          }
        }
      } else {
        // Insert new draft
        console.log('Creating new draft with draftId:', draftId);
        const { error } = await supabase
          .from('form_drafts')
          .insert(draftData);

        if (error) {
          // If the new columns don't exist, try with old format
          if (error.message && (error.message.includes('draft_id') || error.message.includes('session_id'))) {
            console.log('New draft columns not found, using legacy format');
            const legacyData = {
              form_id: formId,
              user_id: user.data.user.id,
              form_name: formName || form?.name || 'Untitled Form',
              draft_data: draftValues,
              updated_at: new Date().toISOString()
            };
            
            // Use the old approach - this will overwrite any existing draft
            const { data: existingLegacyDraft } = await supabase
              .from('form_drafts')
              .select('id')
              .eq('form_id', formId)
              .eq('user_id', user.data.user.id)
              .limit(1);
            
            if (existingLegacyDraft && existingLegacyDraft.length > 0) {
              const { error: updateError } = await supabase
                .from('form_drafts')
                .update(legacyData)
                .eq('id', existingLegacyDraft[0].id);
              
              if (updateError) throw updateError;
            } else {
              const { error: insertError } = await supabase
                .from('form_drafts')
                .insert(legacyData);
              
              if (insertError) throw insertError;
            }
          } else {
            throw error;
          }
        }
      }

      if (!isMigration) {
        setHasDraft(true);
        setLastSaveTime(new Date());
        console.log('Draft saved to Supabase:', draftData);
        
        // For manual saves (not auto-saves), generate a new unique draft ID for the next potential draft
        // This allows users to create multiple drafts of the same form from the same session
        if (!isAutoSave) {
          const sessionId = getSessionId();
          const newDraftId = generateDraftId(formId, user.data.user.id, sessionId, true); // true for unique
          setCurrentDraftId(newDraftId);
          console.log('🆕 Generated new draft ID for next draft:', newDraftId);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving draft to Supabase:', error);
      
      // Fallback to localStorage if Supabase fails
      if (!isMigration) {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          // For auto-saves, always save to localStorage to preserve draft state
          // For manual saves, only save if there are actual values
          const shouldSaveToLocalStorage = isAutoSave || (draftValues && Object.keys(draftValues).length > 0);
          
          if (shouldSaveToLocalStorage) {
            // For manual saves, check for meaningful values
            let hasActualValues = true;
            if (!isAutoSave && draftValues && Object.keys(draftValues).length > 0) {
              hasActualValues = Object.values(draftValues).some(value => {
                if (Array.isArray(value)) {
                  return value.length > 0;
                }
                return value !== null && value !== undefined && value !== '';
              });
            }

            if (isAutoSave || hasActualValues) {
              const draftKey = `form_draft_${formId}_${user.data.user.id}`;
              const fallbackData = {
                formId,
                formName: formName || form?.name || 'Untitled Form',
                values: draftValues || {},
                savedAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
              };
              
              localStorage.setItem(draftKey, JSON.stringify(fallbackData));
              setHasDraft(true);
              setLastSaveTime(new Date());
              console.log('Draft saved to localStorage (fallback):', fallbackData);
              
              // For manual saves (not auto-saves), generate a new unique draft ID for the next potential draft
              // This allows users to create multiple drafts of the same form from the same session
              if (!isAutoSave) {
                const sessionId = getSessionId();
                const newDraftId = generateDraftId(formId, user.data.user.id, sessionId, true); // true for unique
                setCurrentDraftId(newDraftId);
                console.log('🆕 Generated new draft ID for next draft (localStorage fallback):', newDraftId);
              }
            }
          }
        }
      }
      
      return false;
    }
  }, [formId, form?.name, currentDraftId, specificDraftId]);

  // Load draft from Supabase
  const loadDraft = useCallback(async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        // Clear draft state if no user
        setHasDraft(false);
        setLastSaveTime(null);
        return;
      }

      const sessionId = getSessionId();
      
      console.log('=== Draft Loading Debug ===');
      console.log('isDraftContinue:', isDraftContinue);
      console.log('specificDraftId:', specificDraftId);
      console.log('sessionId:', sessionId);
      console.log('formId:', formId);
      
      // If coming from dashboard with specific draft ID, load that draft
      if (isDraftContinue && specificDraftId) {
        const targetDraftId = specificDraftId;
        console.log('Loading specific draft:', targetDraftId);
        
        // Try to load from Supabase first - look for target draft
        let draftData = null;
        let error = null;

        // First try with new draft_id column
        const { data: draftResults, error: newError } = await supabase
          .from('form_drafts')
          .select('*')
          .eq('draft_id', targetDraftId)
          .limit(1);

        if (newError && (newError.message?.includes('draft_id') || newError.code === '42703')) {
          // New columns don't exist, fall back to old method
          console.log('New draft columns not found, using legacy format');
          const { data: legacyResults, error: legacyError } = await supabase
            .from('form_drafts')
            .select('*')
            .eq('form_id', formId)
            .eq('user_id', user.data.user.id)
            .limit(1);
          
          draftData = legacyResults && legacyResults.length > 0 ? legacyResults[0] : null;
          error = legacyError;
        } else {
          draftData = draftResults && draftResults.length > 0 ? draftResults[0] : null;
          error = newError;
        }

        if (!error && draftData && draftData.draft_data && Object.keys(draftData.draft_data).length > 0) {
          // Set the current draft ID so we continue using the same one
          setCurrentDraftId(targetDraftId);
          
          // Auto-load the draft without prompting
          setValues(draftData.draft_data);
          setHasDraft(true);
          setLastSaveTime(new Date(draftData.updated_at));
          console.log('Draft auto-loaded from continue link:', draftData);
          
          // Clean up URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      } else {
        // Fill Form button clicked - always start fresh, generate new draft ID
        console.log('Fill Form clicked - starting fresh form');
        const newDraftId = generateDraftId(formId, user.data.user.id, sessionId, true); // true for unique
        setCurrentDraftId(newDraftId);
        console.log('Generated new draft ID for fresh form:', newDraftId);
        
        // Clear any existing state
        setValues({});
        setHasDraft(false);
        setLastSaveTime(null);
      }
    } catch (error) {
      console.error('Error loading draft from Supabase:', error);
      
      // If Supabase fails, try localStorage as fallback only for continuing drafts
      if (isDraftContinue) {
        try {
          const user = await supabase.auth.getUser();
          if (!user.data.user) return;
          
          const draftKey = `form_draft_${formId}_${user.data.user.id}`;
          const localDraftData = localStorage.getItem(draftKey);
          
          if (localDraftData) {
            const draft = JSON.parse(localDraftData);
            const draftValues = draft.values || {};
            
            if (Object.keys(draftValues).length > 0) {
              setValues(draftValues);
              setHasDraft(true);
              setLastSaveTime(new Date(draft.savedAt));
              console.log('Local draft loaded as fallback:', draft);
            }
          }
        } catch (fallbackError) {
          console.error('Error loading draft from localStorage:', fallbackError);
        }
      }
    }
  }, [formId, isDraftContinue, specificDraftId]);

  // Save draft to localStorage or Supabase
  const saveDraft = useCallback(async (isAutoSave = false) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      if (!isAutoSave) {
        setDraftSaving(true);
      }

      await saveDraftToSupabase(values, form?.name, false, isAutoSave);

      if (!isAutoSave) {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
        setDraftSaving(false);
        
        // For manual saves, just show success - don't clear the form
        // The form clearing is only needed for the "Save & Close" functionality
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!isAutoSave) {
        setDraftSaving(false);
      }
    }
  }, [form?.name, values, saveDraftToSupabase]);

  // Load draft on component mount
  useEffect(() => {
    if (formId) {
      loadDraft();
    }
  }, [formId, loadDraft]);

  // Handle ESC key to close draft status panel
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isDraftPanelExpanded) {
        setIsDraftPanelExpanded(false);
      }
    };

    if (isDraftPanelExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDraftPanelExpanded]);

  // Handle click outside to close draft panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDraftPanelExpanded && !event.target.closest('.draft-panel')) {
        setIsDraftPanelExpanded(false);
      }
    };

    if (isDraftPanelExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDraftPanelExpanded]);

  // Clear draft from Supabase and localStorage
  const clearDraft = useCallback(async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Use the stored currentDraftId, or generate the default session-based one as fallback
      const sessionId = getSessionId();
      const draftIdToDelete = currentDraftId || generateDraftId(formId, user.data.user.id, sessionId);

      // Clear only the current session's draft from Supabase
      const { error } = await supabase
        .from('form_drafts')
        .delete()
        .eq('draft_id', draftIdToDelete);

      if (error && (error.message?.includes('draft_id') || error.code === '42703')) {
        // New columns don't exist, fall back to old method (clears all drafts for this user/form)
        console.log('New draft columns not found, using legacy delete');
        const { error: legacyError } = await supabase
          .from('form_drafts')
          .delete()
          .eq('form_id', formId)
          .eq('user_id', user.data.user.id);
        
        if (legacyError) {
          console.error('Error clearing draft from Supabase (legacy):', legacyError);
        } else {
          console.log('Draft cleared from Supabase (legacy method)');
        }
      } else if (error) {
        console.error('Error clearing draft from Supabase:', error);
      } else {
        console.log('Draft cleared from Supabase for current session');
      }

      // Also clear from localStorage (for backward compatibility)
      const draftKey = `form_draft_${formId}_${user.data.user.id}`;
      localStorage.removeItem(draftKey);
      
      setHasDraft(false);
      setLastSaveTime(null);
      setCurrentDraftId(null); // Clear the stored draft ID
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [formId, currentDraftId]);

  // Auto-save draft when values change - DISABLED
  // useEffect(() => {
  //   if (submitting) return; // Don't auto-save during submission

  //   // Auto-save timer - always save the current state if user has interacted with the form
  //   const autoSaveTimer = setTimeout(() => {
  //     // Only auto-save if the user has started filling the form or if there's already a draft
  //     const hasStartedForm = Object.keys(values).length > 0 || hasDraft;
      
  //     if (hasStartedForm) {
  //       // Save draft with current values (even if empty - this preserves the draft state)
  //       saveDraft(true); // true for auto-save
  //     }
  //   }, 2000); // Auto-save after 2 seconds of inactivity

  //   return () => clearTimeout(autoSaveTimer);
  // }, [values, submitting, saveDraft, hasDraft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    console.log('Form submission started');
    console.log('Form ID:', formId);
    console.log('Fields:', fields);
    console.log('Values:', values);
    
    const missingFields = fields.filter(field => {
      const fieldValue = values[field.id];
      const isEmpty = !fieldValue || fieldValue === '' || 
                     (Array.isArray(fieldValue) && fieldValue.length === 0);
      console.log(`Field ${field.label} (ID: ${field.id}): value = ${fieldValue}, isEmpty = ${isEmpty}, required = ${field.is_required}`);
      return field.is_required && isEmpty;
    }).map(field => field.label);

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setSubmitting(true);
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        alert('Please log in to submit forms');
        setSubmitting(false);
        return;
      }

      // Process form values to handle file fields and preserve field metadata
      const processedValues = {};
      const fieldMetadata = {};
      
      // First, store metadata for ALL fields, not just filled ones
      fields.forEach(field => {
        fieldMetadata[field.id] = {
          label: field.label,
          type: field.field_type,
          is_required: field.is_required,
          options: field.options || [],
          display_order: field.display_order || 0
        };
        console.log(`Field ${field.label} metadata:`, fieldMetadata[field.id]);
      });
      
      // Then process the actual values
      for (const [fieldId, value] of Object.entries(values)) {
        const field = fields.find(f => f.id === fieldId);
        
        if (field) {
          if (field.field_type === 'file') {
            // For file fields, store file information instead of the actual file object
            if (value) {
              if (field.allowMultiple && Array.isArray(value)) {
                processedValues[fieldId] = value.map(file => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  lastModified: file.lastModified
                }));
              } else if (value.name) {
                processedValues[fieldId] = {
                  name: value.name,
                  size: value.size,
                  type: value.type,
                  lastModified: value.lastModified
                };
              }
            }
          } else {
            processedValues[fieldId] = value;
          }
        }
      }

      // Prepare submission data with field metadata
      const submissionData = {
        form_id: formId,
        submitted_by: (user && user.data && user.data.user && user.data.user.id) ? user.data.user.id : 'public-user',
        submission_data: processedValues,
        field_metadata: fieldMetadata, // Store field names and types at submission time
        submitted_at: new Date().toISOString()
      };

      // Submit to database
      console.log('Attempting to submit form data:', submissionData);
      
      // Try to insert with field_metadata first
      let { data, error } = await supabase
        .from('form_submissions')
        .insert(submissionData);

      // If field_metadata column doesn't exist, try without it
      if (error && error.message && error.message.includes('column "field_metadata" does not exist')) {
        console.log('field_metadata column does not exist, submitting without it');
        const { field_metadata, ...submissionDataWithoutMetadata } = submissionData;
        const result = await supabase
          .from('form_submissions')
          .insert(submissionDataWithoutMetadata);
        
        data = result.data;
        error = result.error;
      }

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Submission error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        // Check if it's a table not found error
        if (error.message && (
          error.message.includes('relation "public.form_submissions" does not exist') || 
          error.message.includes('table "form_submissions" does not exist') ||
          error.code === '42P01'
        )) {
          // Fallback: Store in localStorage temporarily
          console.log('Table does not exist, storing locally');
          const localSubmissions = JSON.parse(localStorage.getItem('form_submissions') || '[]');
          localSubmissions.push({
            ...submissionData,
            id: Date.now().toString(),
            stored_locally: true
          });
          localStorage.setItem('form_submissions', JSON.stringify(localSubmissions));
          
          alert('Form submitted successfully! (Stored locally - please create the form_submissions table in Supabase using the provided SQL script)');
          setSuccessMessage('Form submitted successfully! (Stored locally)');
          setShowSuccess(true);
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else if (error.code === '23505') {
          // Duplicate entry error
          alert('This form has already been submitted or there was a duplicate entry error.');
          setSubmitting(false);
          return;
        } else if (error.message && error.message.includes('JWT')) {
          alert('Authentication error. Please log out and log back in.');
          setSubmitting(false);
          return;
        } else {
          // Handle empty error objects and provide better debugging
          let errorMessage = 'Unknown error occurred';
          
          if (error.message) {
            errorMessage = error.message;
          } else if (error.error_description) {
            errorMessage = error.error_description;
          } else if (error.details) {
            errorMessage = error.details;
          } else if (error.hint) {
            errorMessage = error.hint;
          } else if (typeof error === 'object' && Object.keys(error).length > 0) {
            errorMessage = JSON.stringify(error);
          }
          
          console.error('Full error object:', error);
          alert('Error submitting form: ' + errorMessage);
          setSubmitting(false);
          return;
        }
      } else {
        console.log('Form submitted successfully to database');
        setSuccessMessage('Form submitted successfully!');
        setShowSuccess(true);
        
        // Clear draft after successful submission
        await clearDraft();
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
      
      // Clear form values after successful submission
      setValues({});
      
      // Reset file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
      });
      
    } catch (error) {
      console.error('Unexpected error during submission:', error);
      alert('An unexpected error occurred while submitting the form.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const baseClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900";
    const disabledClasses = field.is_readonly ? "bg-gray-100 cursor-not-allowed" : "";
    
    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            disabled={field.is_readonly}
            required={field.is_required}
            className={`${baseClasses} ${disabledClasses} resize-none`}
            rows="4"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
            value={values[field.id] || ''}
          />
        );
      
      case 'checkbox':
        // If field has options, render as checkbox group (multiple checkboxes)
        if (field.options && field.options.length > 0) {
          return (
            <div className="space-y-3">
              {field.options.map((option, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`${field.id}-${i}`}
                    disabled={field.is_readonly}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const currentValues = values[field.id] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(val => val !== option);
                      setValues({ ...values, [field.id]: newValues });
                    }}
                    checked={(values[field.id] || []).includes(option)}
                  />
                  <label 
                    htmlFor={`${field.id}-${i}`}
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          );
        } else {
          // Single checkbox (no options) - include label in the rendering since it's skipped above
          return (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={`checkbox-${field.id}`}
                disabled={field.is_readonly}
                required={field.is_required}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setValues({ ...values, [field.id]: e.target.checked })}
                checked={values[field.id] || false}
              />
              <label 
                htmlFor={`checkbox-${field.id}`}
                className="text-sm text-gray-700 cursor-pointer select-none"
              >
                {field.label}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          );
        }

      case 'checkbox-group':
        return (
          <div className="space-y-3">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`${field.id}-${i}`}
                  disabled={field.is_readonly}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => {
                    const currentValues = values[field.id] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(val => val !== option);
                    setValues({ ...values, [field.id]: newValues });
                  }}
                  checked={(values[field.id] || []).includes(option)}
                />
                <label 
                  htmlFor={`${field.id}-${i}`}
                  className="text-sm text-gray-700 cursor-pointer select-none"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`${field.id}-${i}`}
                  name={field.id}
                  disabled={field.is_readonly}
                  required={field.is_required}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => setValues({ ...values, [field.id]: option })}
                  checked={values[field.id] === option}
                />
                <label 
                  htmlFor={`${field.id}-${i}`}
                  className="text-sm text-gray-700 cursor-pointer select-none"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      
      case 'dropdown':
      case 'select':
        // Check if field has options - if yes, render as checkbox group for multi-select or radio for single-select
        if (field.options && field.options.length > 0) {
          // For select fields with options, render as checkboxes (multi-select)
          return (
            <div className="space-y-3">
              {field.options.map((option, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`${field.id}-${i}`}
                    disabled={field.is_readonly}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const currentValues = values[field.id] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(val => val !== option);
                      setValues({ ...values, [field.id]: newValues });
                    }}
                    checked={(values[field.id] || []).includes(option)}
                  />
                  <label 
                    htmlFor={`${field.id}-${i}`}
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          );
        } else {
          // Fallback to dropdown if no options
          return (
            <select
              disabled={field.is_readonly}
              required={field.is_required}
              className={`${baseClasses} ${disabledClasses}`}
              onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
              value={values[field.id] || ''}
            >
              <option value="">Select an option...</option>
            </select>
          );
        }

      case 'file':
        return (
          <div className="space-y-3">
            <input
              type="file"
              disabled={field.is_readonly}
              required={field.is_required}
              accept={field.accept || '*'}
              multiple={field.allowMultiple || false}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                
                // Validate file sizes if maxSize is specified
                if (field.maxSize) {
                  const maxSizeInBytes = field.maxSize * 1024 * 1024;
                  const oversizedFiles = files.filter(file => file.size > maxSizeInBytes);
                  
                  if (oversizedFiles.length > 0) {
                    alert(`Some files exceed the maximum size limit of ${field.maxSize} MB. Please select smaller files.`);
                    e.target.value = ''; // Clear the input
                    return;
                  }
                }
                
                setValues({ ...values, [field.id]: field.allowMultiple ? files : files[0] });
              }}
            />
            
            {/* File info display */}
            <div className="text-sm text-gray-600 space-y-1">
              {field.accept && (
                <p>
                  <span className="font-medium">Accepted types:</span> {field.accept}
                </p>
              )}
              {field.maxSize && (
                <p>
                  <span className="font-medium">Maximum size:</span> {field.maxSize} MB per file
                </p>
              )}
              {field.allowMultiple && (
                <p>
                  <span className="font-medium">Multiple files:</span> Allowed
                </p>
              )}
            </div>
            
            {/* Display selected files */}
            {values[field.id] && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-sm text-gray-700 mb-2">Selected Files:</p>
                {field.allowMultiple ? (
                  <ul className="space-y-1">
                    {values[field.id].map((file, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {values[field.id].name} ({(values[field.id].size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <input
            type={field.field_type}
            disabled={field.is_readonly}
            required={field.is_required}
            className={`${baseClasses} ${disabledClasses}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
            value={values[field.id] || ''}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{form?.name || 'Form'}</h1>
            {form?.type && (
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {form.type}
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field, index) => {
              const { isVisible, isRequired } = getFieldVisibility(field.id);
              
              if (!isVisible) return null;
              
              const fieldWithLogic = { ...field, is_required: isRequired };
              
              return (
                <div key={field.id} className="space-y-2">
                  {/* Show label for all fields except single checkboxes (checkbox without options) */}
                  {!(field.field_type === 'checkbox' && (!field.options || field.options.length === 0)) && (
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label || 'Unnamed Field'}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  
                  {renderField(fieldWithLogic)}
                  
                  {field.is_readonly && (
                    <p className="text-xs text-gray-500">This field is read-only</p>
                  )}
                </div>
              );
            })}
            
            {fields.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No fields in this form</h3>
                <p className="text-gray-500">This form doesn't have any fields to fill out yet.</p>
              </div>
            ) : (
              <div className="pt-6 border-t border-gray-200">
                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Save Draft Button */}
                    <button
                      type="button"
                      onClick={() => saveDraft(false)}
                      disabled={draftSaving}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                      {draftSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving Draft...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
                          </svg>
                          Save Draft
                        </>
                      )}
                    </button>

                    {/* Save & Close Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const user = await supabase.auth.getUser();
                          if (user.data.user) {
                            setDraftSaving(true);
                            await saveDraftToSupabase(values, form?.name, false, false);
                            console.log('Draft saved, redirecting to dashboard');
                            navigate('/');
                          }
                        } catch (error) {
                          console.error('Error saving draft before redirect:', error);
                          // Even if save fails, redirect to dashboard
                          navigate('/');
                        } finally {
                          setDraftSaving(false);
                        }
                      }}
                      disabled={draftSaving}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                      {draftSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 074 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
                          </svg>
                          Save & Close
                        </>
                      )}
                    </button>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Submit Form
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Minimized Draft Status Indicator */}
        {hasDraft && lastSaveTime && (
          <div className="fixed bottom-6 right-6 z-40">
            <div className={`draft-panel bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${
              isDraftPanelExpanded ? 'w-80' : 'w-auto'
            }`}>
              {/* Collapsed State - Small indicator */}
              {!isDraftPanelExpanded && (
                <button
                  onClick={() => setIsDraftPanelExpanded(true)}
                  className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Draft auto-saved - Click to expand"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">Draft</span>
                </button>
              )}

              {/* Expanded State - Full panel */}
              {isDraftPanelExpanded && (
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="text-sm font-semibold text-gray-800">Draft Status</h4>
                    </div>
                    <button
                      onClick={() => setIsDraftPanelExpanded(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-800 font-medium">Auto-saved</p>
                        <p className="text-xs text-gray-500">{lastSaveTime.toLocaleString()}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600">
                      Your progress is automatically saved. You can continue editing or save to close.
                    </p>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => setIsDraftPanelExpanded(false)}
                        className="flex-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Continue
                      </button>
                      <button
                        onClick={async () => {
                          setIsDraftPanelExpanded(false);
                          
                          // Save draft and redirect to dashboard
                          try {
                            const user = await supabase.auth.getUser();
                            if (user.data.user) {
                              setDraftSaving(true);
                              await saveDraftToSupabase(values, form?.name, false, false);
                              console.log('Draft saved, redirecting to dashboard');
                              navigate('/');
                            }
                          } catch (error) {
                            console.error('Error saving draft before redirect:', error);
                            // Even if save fails, redirect to dashboard
                            navigate('/');
                          } finally {
                            setDraftSaving(false);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                      >
                        Save & Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Notification */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center z-50">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="text-sm opacity-90">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Draft Saved Notification */}
        {draftSaved && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center z-50">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
            </svg>
            <div>
              <p className="font-medium">Draft saved successfully!</p>
              <p className="text-sm opacity-90">Continue editing or use Save & Close...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
