import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export default function SubmissionFormView({ submission, onBack }) {
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to generate consistent color for form names
  const getFormNameColor = (formName) => {
    if (!formName) return 'from-gray-400 to-gray-500';
    
    // Create a simple hash from the form name
    let hash = 0;
    for (let i = 0; i < formName.length; i++) {
      const char = formName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Define color combinations that work well with dark theme
    const colorCombinations = [
      'from-cyan-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-rose-400 to-red-500',
      'from-indigo-400 to-purple-500',
      'from-emerald-400 to-green-500',
      'from-amber-400 to-yellow-500',
      'from-violet-400 to-purple-500',
      'from-teal-400 to-cyan-500',
      'from-orange-400 to-red-500',
      'from-sky-400 to-blue-500',
    ];
    
    // Use absolute value and modulo to get consistent index
    const index = Math.abs(hash) % colorCombinations.length;
    return colorCombinations[index];
  };

  useEffect(() => {
    const fetchFormAndFields = async () => {
      if (!submission) return;
      
      try {
        // Fetch form details
        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', submission.form_id)
          .single();
        
        if (!formError) {
          setForm(formData);
        }

        // Use field metadata from submission if available (shows form as it was when filled)
        if (submission.field_metadata) {
          console.log('Using field metadata from submission:', submission.field_metadata);
          
          // Convert field metadata to fields array format
          const fieldsFromMetadata = Object.entries(submission.field_metadata).map(([fieldId, metadata]) => {
            console.log(`Processing field ${fieldId}:`, metadata);
            
            // Handle options - they might be stored as JSON string or array
            let options = [];
            if (metadata.options) {
              if (typeof metadata.options === 'string') {
                try {
                  options = JSON.parse(metadata.options);
                } catch (e) {
                  console.warn('Failed to parse options JSON:', metadata.options);
                  options = [];
                }
              } else if (Array.isArray(metadata.options)) {
                options = metadata.options;
              }
            }
            
            console.log(`Field ${fieldId} options:`, options);
            
            return {
              id: fieldId,
              label: metadata.label,
              field_type: metadata.type,
              is_required: metadata.is_required || false,
              options: options,
              display_order: metadata.display_order || 0
            };
          });
          
          // Sort by display order
          fieldsFromMetadata.sort((a, b) => a.display_order - b.display_order);
          setFields(fieldsFromMetadata);
        } else {
          // Fallback to current form fields for legacy submissions
          console.log('No field metadata found, using current form fields');
          const { data: fieldsData, error: fieldsError } = await supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', submission.form_id)
            .order('display_order');
          
          if (!fieldsError) {
            setFields(fieldsData);
          }
        }
      } catch (error) {
        console.error('Error fetching form details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormAndFields();
  }, [submission]);

  const getFieldValue = (fieldId) => {
    // First try to get value using the field ID directly
    if (submission?.submission_data?.[fieldId]) {
      return submission.submission_data[fieldId];
    }
    
    // If not found, try to find using human-readable field key generated from label
    if (submission?.field_metadata && submission.field_metadata[fieldId]) {
      const metadata = submission.field_metadata[fieldId];
      if (metadata.label) {
        const fieldKey = metadata.label.toLowerCase()
          .replace(/[^a-z0-9\s]/gi, '')  // Remove special characters
          .replace(/\s+/g, '_')          // Replace spaces with underscores
          .substring(0, 50);             // Limit length
        
        if (submission.submission_data[fieldKey]) {
          return submission.submission_data[fieldKey];
        }
      }
    }
    
    // Last resort: search all submission data keys for a match
    if (submission?.submission_data) {
      for (const [key, value] of Object.entries(submission.submission_data)) {
        // If we find a key that matches the field pattern, return it
        if (key === fieldId || key.includes(fieldId)) {
          return value;
        }
      }
    }
    
    return '';
  };

  const renderField = (field) => {
    const value = getFieldValue(field.id);
    const fieldType = field.field_type;
    
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'number':
      case 'tel':
      case 'url':
      case 'date':
      case 'time':
      case 'textarea':
        return (
          <div className="bg-gray-900/50 border border-purple-500/20 rounded-lg p-4 text-gray-200">
            {value || <span className="text-gray-500 italic">No answer provided</span>}
          </div>
        );
      
      case 'checkbox':
        if (field.options && field.options.length > 0) {
          const checkedValues = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-3">
              {field.options.map((option, i) => {
                const isSelected = checkedValues.includes(option);
                return (
                  <div key={i} className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 border-transparent' 
                        : 'bg-gray-800 border-gray-600'
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <label className={`text-sm cursor-default select-none ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                      {option}
                    </label>
                  </div>
                );
              })}
            </div>
          );
        } else {
          // Single checkbox (no options)
          return (
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                value 
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 border-transparent' 
                  : 'bg-gray-800 border-gray-600'
              }`}>
                {value && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <label className="text-sm text-gray-300 cursor-default select-none">
                {field.label}
                {field.is_required && <span className="text-red-400 ml-1">*</span>}
              </label>
            </div>
          );
        }

      case 'checkbox-group':
        const checkboxValues = Array.isArray(value) ? value : [];
        
        // Show all options if field has options, otherwise show message
        if (!field.options || field.options.length === 0) {
          return (
            <div className="border border-gray-600/50 rounded-lg p-4 bg-gray-700/50">
              <p className="text-gray-400 text-sm">No options available for this checkbox group</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            {field.options.map((option, i) => {
              const isSelected = checkboxValues.includes(option);
              return (
                <div key={i} className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 border-transparent' 
                      : 'bg-gray-800 border-gray-600'
                  }`}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <label className={`text-sm cursor-default select-none ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'radio':
        // Show all options if field has options, otherwise show message
        if (!field.options || field.options.length === 0) {
          return (
            <div className="border border-gray-600/50 rounded-lg p-4 bg-gray-700/50">
              <p className="text-gray-400 text-sm">No options available for this radio button group</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            {field.options.map((option, i) => {
              const isSelected = value === option;
              return (
                <div key={i} className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'border-cyan-500' 
                      : 'border-gray-600 bg-gray-800'
                  }`}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" />
                    )}
                  </div>
                  <label className={`text-sm cursor-default select-none ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
        );
      
      case 'dropdown':
      case 'select':
        // Show all options if field has options, otherwise show message
        if (!field.options || field.options.length === 0) {
          return (
            <div className="border border-gray-600/50 rounded-lg p-4 bg-gray-700/50">
              <p className="text-gray-400 text-sm">No options available for this dropdown</p>
            </div>
          );
        }
        
        // Handle both single values and arrays (for multi-select rendered as checkboxes)
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        
        return (
          <div className="space-y-2">
            <div className="bg-gray-900/50 border border-purple-500/20 rounded-lg p-4">
              <p className="text-xs text-purple-300/70 mb-2">Selected option{selectedValues.length > 1 ? 's' : ''}:</p>
              {selectedValues.length > 0 ? (
                <div className="space-y-1">
                  {selectedValues.map((selectedValue, i) => (
                    <p key={i} className="text-sm font-medium text-cyan-300">
                      {selectedValue}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No options selected</p>
              )}
            </div>
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">All available options:</p>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt, i) => {
                  const isSelected = selectedValues.includes(opt);
                  return (
                    <div key={i} className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      isSelected 
                        ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' 
                        : 'bg-gray-800/50 text-gray-500 border-gray-700'
                    }`}>
                      {isSelected && <span className="mr-1">✓</span>}
                      {opt}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'file':
        const fileValue = value;
        if (!fileValue) {
          return (
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
              <p className="text-gray-500 text-sm italic">No file uploaded</p>
            </div>
          );
        }

        const files = Array.isArray(fileValue) ? fileValue : [fileValue];
        
        return (
          <div className="space-y-3">
            <div className="bg-gray-900/50 border border-purple-500/20 rounded-lg p-4">
              <p className="font-medium text-sm text-purple-300 mb-3">Uploaded Files:</p>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition-colors">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                        {file.type && ` • ${file.type}`}
                      </p>
                    </div>
                    <a 
                      href={file.url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-700">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Form not found</h3>
        <p className="text-gray-400">The form you are looking for is not available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back Button */}
      {onBack && (
        <div className="mb-6">
          <button
            onClick={onBack}
            className="group inline-flex items-center text-gray-400 hover:text-cyan-400 font-medium transition-colors duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center mr-3 group-hover:bg-cyan-500/10 transition-colors border border-gray-700 group-hover:border-cyan-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            Back to Submission List
          </button>
        </div>
      )}
      
      {/* Form Header */}
      <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-500/10 p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div>
              <h2 className={`text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getFormNameColor(form.name)} mb-2`}>
                {form.name}
              </h2>
              <p className="text-gray-400 text-lg">{form.description}</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-gray-300">
                {form.type}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Submitted: <span className="text-gray-200">{new Date(submission.submitted_at).toLocaleString()}</span></span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>
                By: <span className="text-gray-200 font-medium">{submission.submitter_name || 'Anonymous'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
        
      {/* Form version indicator */}
      {submission.field_metadata ? (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-400 mb-1">Original Form Structure</h4>
            <p className="text-xs text-green-300/70 leading-relaxed">
              This view uses the exact form structure stored at the time of submission.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.536 0L3.278 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-amber-400 mb-1">Legacy Submission</h4>
            <p className="text-xs text-amber-300/70 leading-relaxed">
              This submission was made before versioning was enabled. Showing current form structure.
            </p>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6">
        {fields.map((field) => {
          return (
            <div key={field.id} className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-purple-500/20 transition-colors duration-300">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  {field.label}
                  {field.is_required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.description && (
                  <p className="text-xs text-gray-400">{field.description}</p>
                )}
              </div>
              
              {renderField(field)}
              
              {/* Show field type info */}
              <div className="mt-4 pt-3 border-t border-gray-700/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium bg-gray-900/50 px-2 py-1 rounded border border-gray-800">
                    {field.field_type}
                  </span>
                </div>
                {submission.field_metadata && (
                  <span className="text-[10px] text-gray-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Original Field
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state for no fields */}
      {fields.length === 0 && (
        <div className="text-center py-16 bg-gray-800/20 rounded-2xl border border-gray-700/50 border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-700">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No fields found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">This form appears to have no fields or they are no longer available.</p>
        </div>
      )}
    </div>
  );
}
