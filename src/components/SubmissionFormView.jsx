import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export default function SubmissionFormView({ submission, onBack }) {
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return submission?.submission_data?.[fieldId] || '';
  };

  const renderField = (field) => {
    const value = getFieldValue(field.id);
    
    // Field info is already from the correct time (either metadata or current)
    const fieldLabel = field.label;
    const fieldType = field.field_type;
    
    const baseClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 cursor-default";
    
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'number':
      case 'tel':
      case 'url':
        return (
          <input
            type={fieldType}
            value={value || ''}
            readOnly
            className={baseClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            readOnly
            rows={field.rows || 4}
            className={baseClasses}
          />
        );

      case 'checkbox':
        // If field has options, treat it as a checkbox group
        if (field.options && field.options.length > 0) {
          const checkboxValues = Array.isArray(value) ? value : [];
          
          return (
            <div className="space-y-3">
              {field.options.map((option, i) => {
                const isSelected = checkboxValues.includes(option);
                return (
                  <div key={i} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-default"
                    />
                    <label className={`text-sm cursor-default select-none ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
              <input
                type="checkbox"
                checked={value || false}
                readOnly
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-default"
              />
              <label className="text-sm text-gray-700 cursor-default select-none">
                {fieldLabel}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          );
        }

      case 'checkbox-group':
        const checkboxValues = Array.isArray(value) ? value : [];
        
        // Show all options if field has options, otherwise show message
        if (!field.options || field.options.length === 0) {
          return (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <p className="text-gray-500 text-sm">No options available for this checkbox group</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            {field.options.map((option, i) => {
              const isSelected = checkboxValues.includes(option);
              return (
                <div key={i} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-default"
                  />
                  <label className={`text-sm cursor-default select-none ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <p className="text-gray-500 text-sm">No options available for this radio button group</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            {field.options.map((option, i) => {
              const isSelected = value === option;
              return (
                <div key={i} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={isSelected}
                    readOnly
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 cursor-default"
                  />
                  <label className={`text-sm cursor-default select-none ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <p className="text-gray-500 text-sm">No options available for this dropdown</p>
            </div>
          );
        }
        
        // Handle both single values and arrays (for multi-select rendered as checkboxes)
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        
        return (
          <div className="space-y-2">
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Selected option{selectedValues.length > 1 ? 's' : ''}:</p>
              {selectedValues.length > 0 ? (
                <div className="space-y-1">
                  {selectedValues.map((selectedValue, i) => (
                    <p key={i} className="text-sm font-medium text-gray-900">
                      {selectedValue}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No options selected</p>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">All available options:</p>
              <div className="space-y-1">
                {field.options.map((opt, i) => {
                  const isSelected = selectedValues.includes(opt);
                  return (
                    <div key={i} className={`text-sm px-2 py-1 rounded ${isSelected ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-600'}`}>
                      {isSelected && <span className="mr-2">✓</span>}
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
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <p className="text-gray-500 text-sm">No file uploaded</p>
            </div>
          );
        }

        const files = Array.isArray(fileValue) ? fileValue : [fileValue];
        
        return (
          <div className="space-y-3">
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <p className="font-medium text-sm text-gray-700 mb-2">Uploaded Files:</p>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                        {file.type && ` • ${file.type}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-700">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Form not found or no longer available</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      {onBack && (
        <div className="mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Submission List
          </button>
        </div>
      )}
      
      {/* Form Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{form.name}</h2>
        <p className="text-gray-600 mb-4">{form.description}</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500 mb-3">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs sm:text-sm">
            {form.type}
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-xs sm:text-sm">
            Submitted: {new Date(submission.submitted_at).toLocaleString()}
          </span>
        </div>
        
        {/* Form version indicator */}
        {submission.field_metadata ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                Viewing original form as it was when submitted
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              This shows the exact form structure and field names that were present when this submission was made.
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.536 0L3.278 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">
                Legacy submission - showing current form structure
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              This submission was made before field metadata was stored, so it shows the current form structure which may differ from when it was originally filled.
            </p>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4 sm:space-y-6">
        {fields.map((field) => {
          return (
            <div key={field.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.description && (
                  <p className="text-sm text-gray-600 mb-3">{field.description}</p>
                )}
              </div>
              
              {renderField(field)}
              
              {/* Show field type info */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded-full w-fit">
                    {field.field_type}
                  </span>
                  {submission.field_metadata && (
                    <span className="text-gray-500">
                      Original field from submission time
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state for no fields */}
      {fields.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No fields found</h3>
          <p className="text-gray-500">This form appears to have no fields or they are no longer available.</p>
        </div>
      )}
    </div>
  );
}
