import { useState } from 'react';

export default function DevicePreview({ form, fields, values, onValueChange, autoFillMode = false }) {
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Auto-fill dummy data function
  const autoFillDummyData = () => {
    const dummyData = {};
    
    fields.forEach((field) => {
      switch (field.field_type) {
        case 'text':
          if (field.label.toLowerCase().includes('name')) {
            dummyData[field.id] = 'John Doe';
          } else if (field.label.toLowerCase().includes('email')) {
            dummyData[field.id] = 'john.doe@example.com';
          } else if (field.label.toLowerCase().includes('phone')) {
            dummyData[field.id] = '+1 (555) 123-4567';
          } else if (field.label.toLowerCase().includes('company')) {
            dummyData[field.id] = 'Acme Corporation';
          } else {
            dummyData[field.id] = 'Sample text input';
          }
          break;
          
        case 'email':
          dummyData[field.id] = 'user@example.com';
          break;
          
        case 'number':
          dummyData[field.id] = Math.floor(Math.random() * 100) + 1;
          break;
          
        case 'tel':
          dummyData[field.id] = '+1 (555) 987-6543';
          break;
          
        case 'textarea':
          dummyData[field.id] = 'This is a sample multi-line text input with some longer content to demonstrate how the field handles larger amounts of text.';
          break;
          
        case 'select':
          try {
            const options = Array.isArray(field.options) ? field.options : JSON.parse(field.options || '[]');
            if (options.length > 0) {
              dummyData[field.id] = options[Math.floor(Math.random() * options.length)];
            }
          } catch (e) {
            dummyData[field.id] = '';
          }
          break;
          
        case 'radio':
          try {
            const options = Array.isArray(field.options) ? field.options : JSON.parse(field.options || '[]');
            if (options.length > 0) {
              dummyData[field.id] = options[0];
            }
          } catch (e) {
            dummyData[field.id] = '';
          }
          break;
          
        case 'checkbox':
          try {
            const options = Array.isArray(field.options) ? field.options : JSON.parse(field.options || '[]');
            if (options.length > 0) {
              // Select random 1-3 options
              const selectedCount = Math.min(Math.floor(Math.random() * 3) + 1, options.length);
              const shuffled = [...options].sort(() => 0.5 - Math.random());
              dummyData[field.id] = shuffled.slice(0, selectedCount);
            }
          } catch (e) {
            dummyData[field.id] = [];
          }
          break;
          
        case 'date':
          const today = new Date();
          const randomDays = Math.floor(Math.random() * 365);
          const randomDate = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);
          dummyData[field.id] = randomDate.toISOString().split('T')[0];
          break;
          
        case 'time':
          const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
          const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
          dummyData[field.id] = `${hours}:${minutes}`;
          break;
          
        case 'url':
          dummyData[field.id] = 'https://www.example.com';
          break;
          
        default:
          dummyData[field.id] = 'Sample value';
      }
    });
    
    // Update all values at once
    Object.keys(dummyData).forEach(fieldId => {
      onValueChange(fieldId, dummyData[fieldId]);
    });
    
    setIsAutoFilled(true);
  };

  const clearForm = () => {
    const emptyData = {};
    fields.forEach((field) => {
      emptyData[field.id] = field.field_type === 'checkbox' ? [] : '';
    });
    
    Object.keys(emptyData).forEach(fieldId => {
      onValueChange(fieldId, emptyData[fieldId]);
    });
    
    setIsAutoFilled(false);
  };

  const getDeviceClass = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6l1 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1v-1l1-1zM3 3a1 1 0 011-1h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" />
          </svg>
        );
      case 'desktop':
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const renderField = (field, index) => {
    const fieldValue = values[field.id] || (field.field_type === 'checkbox' ? [] : '');

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'number':
      case 'tel':
      case 'url':
      case 'date':
      case 'time':
        return (
          <input
            key={field.id}
            type={field.field_type}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            required={field.is_required}
            readOnly={field.is_readonly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'textarea':
        return (
          <textarea
            key={field.id}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            required={field.is_required}
            readOnly={field.is_readonly}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          />
        );

      case 'select':
        const selectOptions = Array.isArray(field.options) ? field.options : JSON.parse(field.options || '[]');
        return (
          <select
            key={field.id}
            value={fieldValue}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            required={field.is_required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {selectOptions.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        const radioOptions = Array.isArray(field.options) ? field.options : JSON.parse(field.options || '[]');
        return (
          <div key={field.id} className="space-y-2">
            {radioOptions.map((option, i) => (
              <label key={i} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={fieldValue === option}
                  onChange={(e) => onValueChange(field.id, e.target.value)}
                  required={field.is_required}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        const checkboxOptions = Array.isArray(field.options) ? field.options : JSON.parse(field.options || '[]');
        return (
          <div key={field.id} className="space-y-2">
            {checkboxOptions.map((option, i) => (
              <label key={i} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(fieldValue) && fieldValue.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                    if (e.target.checked) {
                      onValueChange(field.id, [...currentValues, option]);
                    } else {
                      onValueChange(field.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            key={field.id}
            type="file"
            accept={field.accept || '*/*'}
            multiple={field.allowMultiple}
            onChange={(e) => onValueChange(field.id, e.target.files)}
            required={field.is_required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        );

      default:
        return (
          <input
            key={field.id}
            type="text"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            required={field.is_required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Header - Fixed */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Preview Form</h3>
          <div className="flex items-center space-x-2">
            {autoFillMode && (
              <>
                <button
                  onClick={autoFillDummyData}
                  disabled={isAutoFilled}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    isAutoFilled
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isAutoFilled ? '✓ Auto-filled' : 'Auto Fill'}
                </button>
                <button
                  onClick={clearForm}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Device Toggle */}
        <div className="flex items-center space-x-1 bg-white rounded-lg p-1">
          {['mobile', 'tablet', 'desktop'].map((device) => (
            <button
              key={device}
              onClick={() => setPreviewDevice(device)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                previewDevice === device
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {getDeviceIcon(device)}
              <span className="capitalize">{device}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
        <div className={`bg-white rounded-lg shadow-lg p-6 ${getDeviceClass()}`}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{form?.name || 'Form Preview'}</h1>
            {form?.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id || index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field, index)}
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No fields added yet</p>
                <p className="text-sm">Add some fields to see the form preview</p>
              </div>
            )}
          </div>

          {fields.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Submit Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
