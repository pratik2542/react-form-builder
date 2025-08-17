import { useState, useEffect } from 'react';

export default function ConditionalLogic({ fields, onUpdateConditions, initialConditions = [] }) {
  const [conditions, setConditions] = useState(initialConditions);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [newCondition, setNewCondition] = useState({
    sourceField: '',
    operator: 'equals',
    value: '',
    targetField: '',
    action: 'show'
  });

  // Initialize conditions when initialConditions prop changes
  useEffect(() => {
    setConditions(initialConditions);
  }, [initialConditions, fields]);

  const fieldOptions = fields.map((field, index) => {
    // Parse options if they're stored as JSON string
    let parsedOptions = [];
    if (field.options) {
      try {
        parsedOptions = Array.isArray(field.options) 
          ? field.options 
          : JSON.parse(field.options);
      } catch (e) {
        parsedOptions = [];
      }
    }

    return {
      id: field.id || `field_${index}`,
      label: field.label || `Field ${index + 1}`,
      type: field.field_type,
      options: parsedOptions
    };
  });

  const addCondition = () => {
    if (!newCondition.sourceField || !newCondition.targetField) {
      alert('Please select both source and target fields');
      return;
    }

    const condition = {
      id: `condition-${Date.now()}`,
      ...newCondition
    };
    
    const newConditions = [...conditions, condition];
    setConditions(newConditions);
    onUpdateConditions(newConditions);
    setShowAddCondition(false);
    setNewCondition({
      sourceField: '',
      operator: 'equals',
      value: '',
      targetField: '',
      action: 'show'
    });
  };

  const updateNewCondition = (property, value) => {
    setNewCondition(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const updateCondition = (conditionId, property, value) => {
    const newConditions = conditions.map(condition => 
      condition.id === conditionId 
        ? { ...condition, [property]: value }
        : condition
    );
    setConditions(newConditions);
    onUpdateConditions(newConditions);
  };

  const removeCondition = (conditionId) => {
    const newConditions = conditions.filter(condition => condition.id !== conditionId);
    setConditions(newConditions);
    onUpdateConditions(newConditions);
  };

  const getOperatorOptions = (fieldType) => {
    const baseOptions = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Does not equal' }
    ];

    if (['text', 'email', 'textarea'].includes(fieldType)) {
      return [
        ...baseOptions,
        { value: 'contains', label: 'Contains' },
        { value: 'not_contains', label: 'Does not contain' },
        { value: 'starts_with', label: 'Starts with' },
        { value: 'ends_with', label: 'Ends with' },
        { value: 'is_empty', label: 'Is empty' },
        { value: 'is_not_empty', label: 'Is not empty' }
      ];
    }

    if (['number', 'date'].includes(fieldType)) {
      return [
        ...baseOptions,
        { value: 'greater_than', label: 'Greater than' },
        { value: 'less_than', label: 'Less than' },
        { value: 'greater_equal', label: 'Greater than or equal' },
        { value: 'less_equal', label: 'Less than or equal' }
      ];
    }

    return baseOptions;
  };

  const getValueInput = (condition, sourceField, isNewCondition = false) => {
    if (!sourceField) return null;

    const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator);
    if (!needsValue) return null;

    const currentValue = isNewCondition ? newCondition.value : condition.value;
    const onChange = isNewCondition 
      ? (value) => updateNewCondition('value', value)
      : (value) => updateCondition(condition.id, 'value', value);

    if (['select', 'radio'].includes(sourceField.type) && sourceField.options.length > 0) {
      return (
        <select
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
        >
          <option value="">Select value...</option>
          {sourceField.options.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (sourceField.type === 'checkbox' && sourceField.options.length > 0) {
      return (
        <select
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
        >
          <option value="">Select option...</option>
          {sourceField.options.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    const inputType = sourceField.type === 'number' ? 'number' : 
                     sourceField.type === 'date' ? 'date' : 'text';

    return (
      <input
        type={inputType}
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter value..."
        className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Conditional Logic</h3>
          <p className="text-sm text-gray-300 mt-1">
            Show, hide, or modify fields based on user responses
          </p>
        </div>
        <button
          onClick={() => setShowAddCondition(true)}
          disabled={fieldOptions.length < 2}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-md hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Condition</span>
        </button>
      </div>

      {fieldOptions.length < 2 && (
        <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm rounded-lg border-2 border-dashed border-yellow-400/50">
          <svg className="mx-auto h-12 w-12 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h4 className="text-lg font-medium text-white mb-2">Not enough fields</h4>
          <p className="text-yellow-300 mb-4">
            You need at least 2 fields to create conditional logic. Go back to the Design tab and add more fields.
          </p>
        </div>
      )}

      {conditions.length === 0 && !showAddCondition && fieldOptions.length >= 2 && (
        <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-600/50">
          <svg className="mx-auto h-12 w-12 text-purple-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h4 className="text-lg font-medium text-white mb-2">No conditional logic set</h4>
          <p className="text-gray-300 mb-4">
            Add conditions to create dynamic forms that adapt based on user input
          </p>
          <button
            onClick={() => setShowAddCondition(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-md hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Your First Condition</span>
          </button>
        </div>
      )}

      {/* Add Condition Form */}
      {showAddCondition && fieldOptions.length >= 2 && (
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-lg p-6 drop-shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Add New Condition</h4>
            <button
              onClick={() => {
                setShowAddCondition(false);
                setNewCondition({
                  sourceField: '',
                  operator: 'equals',
                  value: '',
                  targetField: '',
                  action: 'show'
                });
              }}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">When field</label>
              <select 
                value={newCondition.sourceField}
                onChange={(e) => updateNewCondition('sourceField', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
              >
                <option value="">Select field...</option>
                {fieldOptions.map(field => (
                  <option key={field.id} value={field.id}>{field.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">Condition</label>
              <select 
                value={newCondition.operator}
                onChange={(e) => updateNewCondition('operator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
              >
                {getOperatorOptions(fieldOptions.find(f => f.id === newCondition.sourceField)?.type).map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">Value</label>
              {getValueInput(newCondition, fieldOptions.find(f => f.id === newCondition.sourceField), true)}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">Action</label>
              <select 
                value={newCondition.action}
                onChange={(e) => updateNewCondition('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
              >
                <option value="show">Show field</option>
                <option value="hide">Hide field</option>
                <option value="require">Make required</option>
                <option value="optional">Make optional</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">Target field</label>
              <select 
                value={newCondition.targetField}
                onChange={(e) => updateNewCondition('targetField', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
              >
                <option value="">Select field...</option>
                {fieldOptions.filter(f => f.id !== newCondition.sourceField).map(field => (
                  <option key={field.id} value={field.id}>{field.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Preview of new condition */}
          {newCondition.sourceField && newCondition.targetField && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-md border border-purple-400/30">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Preview:</span> When "
                <span className="font-medium text-cyan-400">
                  {fieldOptions.find(f => f.id === newCondition.sourceField)?.label || 'Field'}
                </span>"
                <span className="mx-1">
                  {getOperatorOptions(fieldOptions.find(f => f.id === newCondition.sourceField)?.type)
                    .find(op => op.value === newCondition.operator)?.label?.toLowerCase() || newCondition.operator}
                </span>
                {!['is_empty', 'is_not_empty'].includes(newCondition.operator) && newCondition.value && (
                  <span className="font-medium text-white">"{newCondition.value}"</span>
                )}
                <span className="mx-1">then</span>
                <span className="font-medium text-purple-400">{newCondition.action}</span>
                <span className="mx-1">"</span>
                <span className="font-medium text-green-400">
                  {fieldOptions.find(f => f.id === newCondition.targetField)?.label || 'Target Field'}
                </span>"
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddCondition(false);
                setNewCondition({
                  sourceField: '',
                  operator: 'equals',
                  value: '',
                  targetField: '',
                  action: 'show'
                });
              }}
              className="px-4 py-2 text-gray-300 border border-gray-600/50 rounded-md hover:bg-gray-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addCondition}
              disabled={!newCondition.sourceField || !newCondition.targetField}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-md hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            >
              Add Condition
            </button>
          </div>
        </div>
      )}

      {/* Existing Conditions */}
      {conditions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Active Conditions</h4>
          {conditions.map((condition, index) => {
            const sourceField = fieldOptions.find(f => f.id === condition.sourceField);
            const targetField = fieldOptions.find(f => f.id === condition.targetField);
            
            // Debug logging
            console.log(`Condition ${index + 1}:`, {
              condition,
              sourceFieldId: condition.sourceField,
              targetFieldId: condition.targetField,
              sourceFieldFound: sourceField?.label,
              targetFieldFound: targetField?.label,
              availableFieldIds: fieldOptions.map(f => f.id)
            });
            
            return (
              <div key={condition.id} className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-lg p-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-400 text-sm font-medium rounded-full border border-cyan-400/30">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-300">Condition {index + 1}</span>
                  </div>
                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">When field</label>
                    <select
                      value={condition.sourceField}
                      onChange={(e) => updateCondition(condition.id, 'sourceField', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
                    >
                      <option value="">Select field...</option>
                      {fieldOptions.map(field => (
                        <option key={field.id} value={field.id}>{field.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Condition</label>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
                    >
                      {getOperatorOptions(sourceField?.type).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Value</label>
                    {getValueInput(condition, sourceField, false)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Action</label>
                    <select
                      value={condition.action}
                      onChange={(e) => updateCondition(condition.id, 'action', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
                    >
                      <option value="show">Show field</option>
                      <option value="hide">Hide field</option>
                      <option value="require">Make required</option>
                      <option value="optional">Make optional</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Target field</label>
                    <select
                      value={condition.targetField}
                      onChange={(e) => updateCondition(condition.id, 'targetField', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
                    >
                      <option value="">Select field...</option>
                      {fieldOptions.filter(f => f.id !== condition.sourceField).map(field => (
                        <option key={field.id} value={field.id}>{field.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Condition Summary */}
                <div className="mt-4 p-3 bg-gray-700/50 rounded-md border border-purple-400/30">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">Rule:</span> When "
                    <span className="font-medium text-cyan-400">{sourceField?.label || 'Field'}</span>"
                    <span className="mx-1">{getOperatorOptions(sourceField?.type).find(op => op.value === condition.operator)?.label?.toLowerCase() || condition.operator}</span>
                    {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                      <span className="font-medium text-white">"{condition.value}"</span>
                    )}
                    <span className="mx-1">then</span>
                    <span className="font-medium text-purple-400">{condition.action}</span>
                    <span className="mx-1">"</span>
                    <span className="font-medium text-green-400">{targetField?.label || 'Target Field'}</span>"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
