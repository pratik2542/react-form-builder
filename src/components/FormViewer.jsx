import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';


export default function FormViewer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  useEffect(() => {
    const fetchFormAndFields = async () => {
      try {
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
          setFields(fieldsData);
          console.log('Fields loaded:', fieldsData);
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

  // Save draft to Supabase
  const saveDraftToSupabase = useCallback(async (draftValues, formName, isMigration = false) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return false;

      const draftData = {
        form_id: formId,
        user_id: user.data.user.id,
        form_name: formName || form?.name || 'Untitled Form',
        draft_data: draftValues,
        updated_at: new Date().toISOString()
      };

      // Try to update existing draft first
      const { data: existingDraft } = await supabase
        .from('form_drafts')
        .select('id')
        .eq('form_id', formId)
        .eq('user_id', user.data.user.id)
        .single();

      if (existingDraft) {
        // Update existing draft
        const { error } = await supabase
          .from('form_drafts')
          .update(draftData)
          .eq('id', existingDraft.id);

        if (error) throw error;
      } else {
        // Insert new draft
        const { error } = await supabase
          .from('form_drafts')
          .insert(draftData);

        if (error) throw error;
      }

      if (!isMigration) {
        setHasDraft(true);
        setLastSaveTime(new Date());
        console.log('Draft saved to Supabase:', draftData);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving draft to Supabase:', error);
      
      // Fallback to localStorage if Supabase fails
      if (!isMigration) {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          const draftKey = `form_draft_${formId}_${user.data.user.id}`;
          const fallbackData = {
            formId,
            formName: formName || form?.name || 'Untitled Form',
            values: draftValues,
            savedAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          };
          
          localStorage.setItem(draftKey, JSON.stringify(fallbackData));
          setHasDraft(true);
          setLastSaveTime(new Date());
          console.log('Draft saved to localStorage (fallback):', fallbackData);
        }
      }
      
      return false;
    }
  }, [formId, form?.name]);

  // Load draft from Supabase
  const loadDraft = useCallback(async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Try to load from Supabase first
      const { data: draftData, error } = await supabase
        .from('form_drafts')
        .select('*')
        .eq('form_id', formId)
        .eq('user_id', user.data.user.id)
        .single();

      if (!error && draftData) {
        setValues(draftData.draft_data || {});
        setHasDraft(true);
        setLastSaveTime(new Date(draftData.updated_at));
        console.log('Draft loaded from Supabase:', draftData);
        return;
      }

      // Fallback: check localStorage for existing drafts and migrate them
      const draftKey = `form_draft_${formId}_${user.data.user.id}`;
      const localDraftData = localStorage.getItem(draftKey);
      
      if (localDraftData) {
        const draft = JSON.parse(localDraftData);
        setValues(draft.values || {});
        setHasDraft(true);
        setLastSaveTime(new Date(draft.savedAt));
        
        // Migrate to Supabase
        await saveDraftToSupabase(draft.values, draft.formName, true);
        
        // Remove from localStorage after successful migration
        localStorage.removeItem(draftKey);
        console.log('Draft migrated from localStorage to Supabase');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      
      // Fallback to localStorage if Supabase fails
      try {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          const draftKey = `form_draft_${formId}_${user.data.user.id}`;
          const localDraftData = localStorage.getItem(draftKey);
          
          if (localDraftData) {
            const draft = JSON.parse(localDraftData);
            setValues(draft.values || {});
            setHasDraft(true);
            setLastSaveTime(new Date(draft.savedAt));
            console.log('Draft loaded from localStorage (fallback):', draft);
          }
        }
      } catch (fallbackError) {
        console.error('Error loading draft from localStorage:', fallbackError);
      }
    }
  }, [formId, saveDraftToSupabase]);

  // Save draft to localStorage or Supabase
  const saveDraft = useCallback(async (isAutoSave = false) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      if (!isAutoSave) {
        setDraftSaving(true);
      }

      await saveDraftToSupabase(values, form?.name);

      if (!isAutoSave) {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
        setDraftSaving(false);
        
        // Redirect to dashboard after manual save
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!isAutoSave) {
        setDraftSaving(false);
      }
    }
  }, [form?.name, values, navigate, saveDraftToSupabase]);

  // Load draft on component mount
  useEffect(() => {
    if (formId) {
      loadDraft();
    }
  }, [formId, loadDraft]);

  // Auto-save draft when values change
  useEffect(() => {
    if (Object.keys(values).length > 0 && !submitting) {
      const autoSaveTimer = setTimeout(() => {
        saveDraft(true); // true for auto-save
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [values, submitting, saveDraft]);

  // Clear draft from Supabase and localStorage
  const clearDraft = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Clear from Supabase
      const { error } = await supabase
        .from('form_drafts')
        .delete()
        .eq('form_id', formId)
        .eq('user_id', user.data.user.id);

      if (error) {
        console.error('Error clearing draft from Supabase:', error);
      } else {
        console.log('Draft cleared from Supabase');
      }

      // Also clear from localStorage (for backward compatibility)
      const draftKey = `form_draft_${formId}_${user.data.user.id}`;
      localStorage.removeItem(draftKey);
      
      setHasDraft(false);
      setLastSaveTime(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

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
        submitted_by: user.data.user.id,
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
        return (
          <select
            disabled={field.is_readonly}
            required={field.is_required}
            className={`${baseClasses} ${disabledClasses}`}
            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
            value={values[field.id] || ''}
          >
            <option value="">Select an option...</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );

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
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                {field.field_type !== 'checkbox' && (
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                
                {renderField(field)}
                
                {field.is_readonly && (
                  <p className="text-xs text-gray-500">This field is read-only</p>
                )}
              </div>
            ))}
            
            {fields.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No fields in this form</h3>
                <p className="text-gray-500">This form doesn't have any fields to fill out yet.</p>
              </div>
            ) : (
              <div className="pt-6 border-t border-gray-200">
                {/* Draft Status */}
                {hasDraft && lastSaveTime && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-sm text-blue-800">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
                      </svg>
                      Draft auto-saved at {lastSaveTime.toLocaleTimeString()}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
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
            )}
          </form>
        </div>

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
              <p className="text-sm opacity-90">Redirecting to dashboard...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
