import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getSuggestedFields } from '../utils/groq';

export default function FormBuilder() {
  const { formId } = useParams(); // Get formId from URL if editing
  const isEditing = Boolean(formId);
  
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [fields, setFields] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalForm, setOriginalForm] = useState(null);
  const navigate = useNavigate();

  const addField = () => {
    setFields([...fields, { 
      label: '', 
      field_type: 'text', 
      is_required: false, 
      is_readonly: false, 
      options: '', 
      accept: '', 
      maxSize: '', 
      allowMultiple: false,
      display_order: fields.length 
    }]);
  };

  const removeField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

  const updateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

const handleAIGenerate = async () => {
  if (!prompt.trim()) {
    alert('Please enter a description for your form');
    return;
  }

  setLoadingAI(true);
  try {
    const aiSuggestions = await getSuggestedFields(prompt);
    console.log('AI suggested fields:', aiSuggestions);
    
    // If aiSuggestions is already an array of field objects, use it directly
    if (Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
      const newFields = aiSuggestions.map((suggestion, i) => ({
        label: suggestion.label || suggestion.name || `Field ${i + 1}`,
        field_type: suggestion.type === 'textarea' ? 'textarea' : (suggestion.type || 'text'),
        is_required: suggestion.required || false,
        is_readonly: false,
        options: suggestion.options ? JSON.stringify(suggestion.options) : '',
        accept: '',
        maxSize: '',
        allowMultiple: false,
        display_order: i
      }));
      setFields(newFields);
      alert(`Successfully generated ${newFields.length} field suggestions!`);
    } else {
      alert('No field suggestions generated. Please try a different description.');
    }
  } catch (err) {
    console.error('Groq AI error:', err);
    // Provide more specific error messages
    let errorMessage = 'AI failed to respond: ';
    if (err.message.includes('API key')) {
      errorMessage += 'Invalid or missing Groq API key. Please check your configuration.';
    } else if (err.message.includes('rate limit')) {
      errorMessage += 'Too many requests. Please wait a moment and try again.';
    } else if (err.message.includes('timeout')) {
      errorMessage += 'Request timed out. Please try again.';
    } else if (err.message.includes('JSON')) {
      errorMessage += 'Invalid response format. Please try rephrasing your request.';
    } else {
      errorMessage += err.message || 'Unknown error occurred.';
    }
    alert(errorMessage);
  } finally {
    setLoadingAI(false);
  }
};

  const saveForm = async () => {
    if (!name.trim()) {
      alert('Please enter a form name');
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field to your form');
      return;
    }

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        alert('Please log in to save forms');
        setLoading(false);
        return;
      }

      // Check for duplicate names in the same category (only if creating new or name/type changed)
      if (!isEditing || originalForm?.name !== name || originalForm?.type !== type) {
        const { data: existingForms, error: checkError } = await supabase
          .from('forms')
          .select('id, name')
          .eq('name', name.trim())
          .eq('type', type.trim())
          .eq('created_by', user.data.user.id);

        if (checkError) {
          throw checkError;
        }

        // If editing, exclude the current form from duplicate check
        const duplicates = isEditing 
          ? existingForms.filter(form => form.id !== formId)
          : existingForms;

        if (duplicates.length > 0) {
          const categoryText = type.trim() ? ` in the "${type}" category` : '';
          const shouldContinue = window.confirm(
            `A form named "${name}"${categoryText} already exists. Do you want to continue anyway?`
          );
          if (!shouldContinue) {
            setLoading(false);
            return;
          }
        }
      }

      let form;
      if (isEditing) {
        // Update existing form
        const { data: updatedForm, error: formError } = await supabase
          .from('forms')
          .update({ name: name.trim(), type: type.trim() })
          .eq('id', formId)
          .select()
          .single();

        if (formError) throw formError;
        form = updatedForm;

        // Delete existing fields
        const { error: deleteError } = await supabase
          .from('form_fields')
          .delete()
          .eq('form_id', formId);

        if (deleteError) throw deleteError;
      } else {
        // Create new form
        const { data: newForm, error: formError } = await supabase
          .from('forms')
          .insert({ name: name.trim(), type: type.trim(), created_by: user.data.user.id })
          .select()
          .single();

        if (formError) throw formError;
        form = newForm;
      }

      // Insert/update fields
      const fieldInserts = fields.map((f, i) => ({
        label: f.label,
        field_type: f.field_type,
        is_required: f.is_required,
        is_readonly: f.is_readonly,
        display_order: i,
        form_id: form.id,
        options: f.options ? JSON.parse(f.options || '[]') : null
      }));

      const { error: fieldError } = await supabase.from('form_fields').insert(fieldInserts);
      if (fieldError) throw fieldError;

      alert(isEditing ? 'Form updated successfully!' : 'Form created successfully!');
      navigate('/');
    } catch (error) {
      console.error('Save form error:', error);
      alert('Error saving form: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load existing form data when editing
  useEffect(() => {
    if (isEditing && formId) {
      const loadForm = async () => {
        setLoading(true);
        try {
          // Load form details
          const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single();

          if (formError) throw formError;

          setName(formData.name);
          setType(formData.type || '');
          setOriginalForm(formData);

          // Load form fields
          const { data: fieldsData, error: fieldsError } = await supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', formId)
            .order('display_order');

          if (fieldsError) throw fieldsError;

          // Convert options back to string format for editing
          const formattedFields = fieldsData.map(field => ({
            ...field,
            options: field.options ? JSON.stringify(field.options) : ''
          }));

          setFields(formattedFields);
        } catch (error) {
          console.error('Error loading form:', error);
          alert('Error loading form: ' + error.message);
          navigate('/');
        } finally {
          setLoading(false);
        }
      };

      loadForm();
    }
  }, [isEditing, formId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
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
          
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isEditing ? 'Edit Form' : 'Create New Form'}
            </h2>
            <p className="text-gray-600 text-lg">
              {isEditing ? 'Update your form with new fields and settings' : 'Build your custom form with AI assistance'}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading form data...</p>
          </div>
        )}

        {/* Form Configuration Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Form Configuration
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Name *</label>
              <input 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500" 
                placeholder="Enter a descriptive name for your form" 
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Category</label>
              <input 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500" 
                placeholder="e.g., Manufacturing, Quality Control, Inspection, Survey, etc." 
                onChange={(e) => setType(e.target.value)} 
                value={type}
              />
              <p className="text-sm text-gray-500 mt-1">Specify the category or type of your form</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Form Description
                  <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">✨ AI Powered</span>
                </span>
              </label>
              <textarea 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none" 
                rows="3"
                placeholder="🤖 Describe what your form should collect and AI will generate fields automatically! (e.g., 'Product quality inspection checklist with defect tracking and approval workflow')" 
                onChange={(e) => setPrompt(e.target.value)} 
                value={prompt}
              />
              {!prompt.trim() && (
                <p className="text-sm text-purple-600 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  💡 Tip: Describe your form and let AI create all the fields for you!
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleAIGenerate} 
                disabled={loadingAI || !prompt.trim()} 
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                {loadingAI ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Fields...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    🚀 Generate Fields with AI
                  </>
                )}
              </button>
              
              <button 
                onClick={addField} 
                className="sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Field Manually
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields Section */}
        {fields.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Form Fields ({fields.length})
            </h3>
            
            <div className="space-y-6">
              {fields.map((f, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200 relative group">
                  <button 
                    onClick={() => removeField(idx)}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all duration-200 shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100"
                    title="Remove field"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">
                      Field #{idx + 1}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Field Label *</label>
                      <input 
                        placeholder="Enter field label" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        value={f.label} 
                        onChange={(e) => updateField(idx, 'label', e.target.value)} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        onChange={(e) => updateField(idx, 'field_type', e.target.value)} 
                        value={f.field_type}
                      >
                        <option value="text">Text Input</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="password">Password</option>
                        <option value="textarea">Textarea</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="checkbox-group">Checkbox Group</option>
                        <option value="radio">Radio Button Group</option>
                        <option value="file">File Upload</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="select">Select</option>
                        <option value="date">Date</option>
                        <option value="time">Time</option>
                        <option value="url">URL</option>
                      </select>
                    </div>
                  </div>
                  
                  {(f.field_type === 'dropdown' || f.field_type === 'select' || f.field_type === 'checkbox-group' || f.field_type === 'radio') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options (JSON Array)
                        {f.field_type === 'checkbox-group' && ' - Multiple selections allowed'}
                        {f.field_type === 'radio' && ' - Single selection only'}
                      </label>
                      <input 
                        placeholder='["Option 1", "Option 2", "Option 3"]' 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm" 
                        value={f.options}
                        onChange={(e) => updateField(idx, 'options', e.target.value)} 
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {f.field_type === 'checkbox-group' || f.field_type === 'radio' 
                          ? 'Enter each option as a JSON array for multiple checkboxes or radio buttons'
                          : 'Enter options as a JSON array'}
                      </p>
                    </div>
                  )}

                  {f.field_type === 'file' && (
                    <div className="mb-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Accepted File Types</label>
                        <input 
                          placeholder='.pdf,.doc,.docx,.jpg,.png (leave empty for all types)' 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          value={f.accept || ''}
                          onChange={(e) => updateField(idx, 'accept', e.target.value)} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Specify file extensions separated by commas (e.g., .pdf,.doc,.jpg)</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum File Size (MB)</label>
                        <input 
                          type="number"
                          placeholder="10" 
                          min="1"
                          max="100"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          value={f.maxSize || ''}
                          onChange={(e) => updateField(idx, 'maxSize', e.target.value)} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum file size in megabytes (1-100 MB)</p>
                      </div>

                      <div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={f.allowMultiple || false} 
                            onChange={(e) => updateField(idx, 'allowMultiple', e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Allow Multiple Files</span>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={f.is_required} 
                        onChange={(e) => updateField(idx, 'is_required', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Required Field</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={f.is_readonly} 
                        onChange={(e) => updateField(idx, 'is_readonly', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Read Only</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="text-center">
          <button 
            onClick={saveForm} 
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center mx-auto min-w-[200px]"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isEditing ? 'Update Form' : 'Save Form'}
              </>
            )}
          </button>
        </div>

        {/* Empty State */}
        {fields.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100 mt-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No fields added yet</h3>
            <p className="text-gray-500 mb-6">
              Use the <strong>AI Form Description</strong> above to generate fields automatically, or add them manually using the buttons at the top.
            </p>
            <div className="flex justify-center">
              <button 
                onClick={addField} 
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Field
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}