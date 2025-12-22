import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getSuggestedFields } from '../utils/groq';
import DevicePreview from './DevicePreview';
import FormShare from './FormShare';
import WidgetLibrary from './WidgetLibrary';
import FormTemplates from './FormTemplates';
import ConditionalLogic from './ConditionalLogic';
import FormAnalytics from './FormAnalytics';

// Mobile-friendly CSS
const mobileStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .mobile-form-builder {
    height: 100vh;
    height: 100dvh;
  }
  /* Custom Scrollbar for desktop */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(17, 24, 39, 0.5); 
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(75, 85, 99, 0.5); 
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.8); 
  }

  @media (max-width: 1023px) {
    .mobile-sidebar {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease-in-out;
    }
    .mobile-sidebar.open {
      opacity: 1;
      pointer-events: auto;
    }
    .mobile-sidebar-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to bottom, rgb(31, 41, 55), rgb(17, 24, 39));
      border-top: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 24px 24px 0 0;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 -10px 40px -10px rgba(0, 0, 0, 0.5);
    }
    .mobile-sidebar.open .mobile-sidebar-content {
      transform: translateY(0);
    }
    .mobile-tab-content {
      height: 100%;
      overflow-y: auto;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = mobileStyles;
  if (!document.head.querySelector('style[data-enhanced-form-builder]')) {
    styleSheet.setAttribute('data-enhanced-form-builder', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default function EnhancedFormBuilder() {
  const { formId } = useParams();
  const isEditing = Boolean(formId);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState(''); // New state for custom form type
  const [fields, setFields] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [previewValues, setPreviewValues] = useState({});
  const [selectedField, setSelectedField] = useState(null);
  const [draggedField, setDraggedField] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileActiveSection, setMobileActiveSection] = useState('settings'); // 'settings', 'ai', 'fields'
  // eslint-disable-next-line no-unused-vars
  const [conditionalLogic, setConditionalLogic] = useState([]);
  const [isMobileFieldsOpen, setIsMobileFieldsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showFieldManager, setShowFieldManager] = useState(false);
  const [showNameInputModal, setShowNameInputModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempType, setTempType] = useState('');
  const [tempCustomType, setTempCustomType] = useState('');
  const navigate = useNavigate();

  // Load existing form if editing
  useEffect(() => {
    if (isEditing) {
      loadExistingForm();
    }
  }, [formId, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset'; // Restore scrolling
    };
  }, [isModalOpen]);

  // Handle scroll detection to disable hover effects
  useEffect(() => {
    let scrollTimeout;
    let isCurrentlyScrolling = false;
    
    const handleScroll = () => {
      if (!isCurrentlyScrolling) {
        isCurrentlyScrolling = true;
        setIsScrolling(true);
        document.body.classList.add('scrolling');
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isCurrentlyScrolling = false;
        setIsScrolling(false);
        document.body.classList.remove('scrolling');
      }, 100); // Reduced delay for faster response
    };

    const handleWheel = (e) => {
      // Immediately set scrolling state on wheel event
      if (!isCurrentlyScrolling) {
        isCurrentlyScrolling = true;
        setIsScrolling(true);
        document.body.classList.add('scrolling');
      }
      handleScroll();
    };

    const handleMouseLeave = () => {
      // Only clear scrolling if we're not actually scrolling
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (isCurrentlyScrolling) {
          isCurrentlyScrolling = false;
          setIsScrolling(false);
          document.body.classList.remove('scrolling');
        }
      }, 50);
    };

    // Add scroll listeners to window and document
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('wheel', handleWheel, { passive: true });
    
    // Also add to common scrollable containers
    const scrollableContainers = [
      '.desktop-main-content',
      '.overflow-y-auto',
      '.form-preview-modal-body',
      '.desktop-properties-panel'
    ];
    
    const elements = [];
    scrollableContainers.forEach(selector => {
      const els = document.querySelectorAll(selector);
      els.forEach(el => {
        el.addEventListener('scroll', handleScroll, { passive: true });
        el.addEventListener('wheel', handleWheel, { passive: true });
        el.addEventListener('mouseleave', handleMouseLeave);
        elements.push(el);
      });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('wheel', handleWheel);
      elements.forEach(el => {
        el.removeEventListener('scroll', handleScroll);
        el.removeEventListener('wheel', handleWheel);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
      document.body.classList.remove('scrolling');
      clearTimeout(scrollTimeout);
    };
  }, []);

  const loadExistingForm = async () => {
    setLoading(true);
    try {
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) throw formError;

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('display_order');

      if (fieldsError) throw fieldsError;

      setName(formData.name);
      setDescription(formData.description || ''); // Load description from DB
      
      // Handle form type and custom type
      const formType = formData.type || '';
      const predefinedTypes = ['contact', 'survey', 'registration', 'feedback', 'application'];
      
      if (predefinedTypes.includes(formType)) {
        setType(formType);
        setCustomType('');
      } else if (formType) {
        setType('other');
        setCustomType(formType);
      } else {
        setType('');
        setCustomType('');
      }
      
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
      
      setFields(fieldsData.map((field, index) => ({
        ...field,
        id: `field_${index}`,
        db_id: field.id  // Keep the database ID for updates
      })));
    } catch (error) {
      console.error('Error loading form:', error);
      alert('Error loading form: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addField = (fieldData = null) => {
    const fieldTypeLabels = {
      'text': 'Text Input',
      'email': 'Email Address', 
      'number': 'Number',
      'tel': 'Phone Number',
      'url': 'Website URL',
      'password': 'Password',
      'textarea': 'Message',
      'select': 'Dropdown Selection',
      'radio': 'Radio Buttons',
      'checkbox': 'Checkboxes',
      'date': 'Date',
      'time': 'Time',
      'datetime-local': 'Date & Time',
      'file': 'File Upload',
      'range': 'Range Slider',
      'color': 'Color Picker'
    };

    const newField = fieldData || {
      label: fieldTypeLabels['text'] || 'Text Input',
      field_type: 'text',
      is_required: false,
      is_readonly: false,
      options: '',
      display_order: fields.length
    };

    // Auto-add default options for select, radio, and checkbox fields
    if (['select', 'radio', 'checkbox'].includes(newField.field_type) && (!newField.options || newField.options === '')) {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    const fieldWithId = {
      ...newField,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      display_order: fields.length
    };

    setFields([...fields, fieldWithId]);
  };

  const removeField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields.map((field, i) => ({ ...field, display_order: i })));
  };

  const duplicateField = (index) => {
    const fieldToDuplicate = { ...fields[index] };
    const duplicatedField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: `${fieldToDuplicate.label} (Copy)`,
      display_order: fields.length
    };
    setFields([...fields, duplicatedField]);
  };

  const handleAIGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description for your form');
      return;
    }

    setLoadingAI(true);
    try {
      const aiSuggestions = await getSuggestedFields(prompt);
      
      if (Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
        const newFields = aiSuggestions.map((suggestion, i) => {
          // Convert options from {label, value} format to simple strings if needed
          let options = '';
          if (suggestion.options) {
            if (Array.isArray(suggestion.options)) {
              const cleanOptions = suggestion.options.map(option => {
                if (typeof option === 'string') {
                  return option;
                } else if (option && typeof option === 'object' && option.label) {
                  return option.label;
                } else if (option && typeof option === 'object' && option.value) {
                  return option.value;
                } else {
                  return String(option);
                }
              });
              options = JSON.stringify(cleanOptions);
            } else if (typeof suggestion.options === 'string') {
              try {
                const parsed = JSON.parse(suggestion.options);
                const cleanOptions = Array.isArray(parsed) ? parsed.map(opt => 
                  typeof opt === 'string' ? opt : (opt.label || opt.value || String(opt))
                ) : [suggestion.options];
                options = JSON.stringify(cleanOptions);
              } catch {
                options = JSON.stringify([suggestion.options]);
              }
            }
          }

          return {
            id: `ai_field_${Date.now()}_${i}`,
            label: suggestion.label || suggestion.name || `Field ${i + 1}`,
            field_type: suggestion.field_type || suggestion.type || 'text',
            is_required: suggestion.required || false,
            is_readonly: false,
            placeholder: suggestion.placeholder || '',
            options: options,
            display_order: i
          };
        });
        setFields(newFields);
        setActiveTab('design'); // Switch to design tab to show generated fields
        alert(`Successfully generated ${newFields.length} field suggestions!`);
      } else {
        alert('No field suggestions generated. Please try a different description.');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      alert('AI failed to generate fields. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const saveForm = async () => {
    if (!name.trim()) {
      // Show form details modal instead of alert
      setTempName(name);
      setTempDescription(description);
      setTempType(type);
      setTempCustomType(customType);
      setShowNameInputModal(true);
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    // Determine the final form type to save
    const finalType = type === 'other' ? customType.trim() : type;

    setLoading(true);
    try {
      let savedFormId = formId;

      if (isEditing) {
        // Update existing form
        // Try to update with conditional_logic first, fallback without it if column doesn't exist
        let updateData = {
          name,
          description,
          type: finalType,
          conditional_logic: JSON.stringify(conditionalLogic)
        };

        let { error: formError } = await supabase
          .from('forms')
          .update(updateData)
          .eq('id', formId);

        // If conditional_logic column doesn't exist, try without it
        if (formError && formError.message && formError.message.includes('conditional_logic')) {
          console.warn('conditional_logic column not found, saving without it');
          const { conditional_logic, ...updateDataWithoutLogic } = updateData;
          const result = await supabase
            .from('forms')
            .update(updateDataWithoutLogic)
            .eq('id', formId);
          formError = result.error;
        }

        if (formError) throw formError;

        // Delete existing fields
        await supabase
          .from('form_fields')
          .delete()
          .eq('form_id', formId);
      } else {
        // Create new form
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          alert('Please log in to save forms');
          setLoading(false);
          return;
        }

        // Try to insert with conditional_logic first, fallback without it if column doesn't exist
        let insertData = {
          name,
          description,
          type: finalType,
          created_by: user.data.user.id,
          conditional_logic: JSON.stringify(conditionalLogic)
        };

        let { data: formData, error: formError } = await supabase
          .from('forms')
          .insert(insertData)
          .select()
          .single();

        // If conditional_logic column doesn't exist, try without it
        if (formError && formError.message && formError.message.includes('conditional_logic')) {
          console.warn('conditional_logic column not found, saving without it');
          const { conditional_logic, ...insertDataWithoutLogic } = insertData;
          const result = await supabase
            .from('forms')
            .insert(insertDataWithoutLogic)
            .select()
            .single();
          formData = result.data;
          formError = result.error;
        }

        if (formError) throw formError;
        savedFormId = formData.id;
      }

      // Insert fields
      const fieldsToInsert = fields.map((field, index) => ({
        form_id: savedFormId,
        label: field.label,
        field_type: field.field_type,
        is_required: field.is_required,
        is_readonly: field.is_readonly,
        display_order: index,
        options: field.options
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsToInsert);

      if (fieldsError) throw fieldsError;

      alert(isEditing ? 'Form updated successfully!' : 'Form created successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle save with form details from modal
  const handleSaveWithName = async () => {
    if (!tempName.trim()) {
      return; // Don't proceed if name is still empty
    }

    if (!tempType.trim() && tempType !== 'other') {
      return; // Don't proceed if type is not selected
    }

    if (tempType === 'other' && !tempCustomType.trim()) {
      return; // Don't proceed if custom type is empty when 'other' is selected
    }

    // Update all the form states and close modal
    setName(tempName.trim());
    setDescription(tempDescription.trim());
    setType(tempType);
    setCustomType(tempCustomType.trim());
    setShowNameInputModal(false);

    // Wait for next tick to ensure state is updated, then save
    setTimeout(async () => {
      await saveFormWithFormDetails(tempName.trim(), tempDescription.trim(), tempType, tempCustomType.trim());
    }, 0);
  };

  // Extracted save logic to reuse with provided form details
  const saveFormWithFormDetails = async (formName, formDesc, formType, formCustomType) => {
    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    // Determine the final form type to save
    const finalType = formType === 'other' ? formCustomType.trim() : formType;

    setLoading(true);
    try {
      let savedFormId = formId;

      if (isEditing) {
        // Update existing form
        let updateData = {
          name: formName,
          description: formDesc,
          type: finalType,
          updated_at: new Date().toISOString()
        };

        // Add conditional_logic if it exists and has data
        if (conditionalLogic && conditionalLogic.length > 0) {
          updateData.conditional_logic = conditionalLogic;
        }

        try {
          const { error } = await supabase
            .from('forms')
            .update(updateData)
            .eq('id', formId)
            .select();

          if (error) throw error;
        } catch (error) {
          console.error('Error updating form:', error);
          // Fallback: try without conditional_logic
          const fallbackData = { ...updateData };
          delete fallbackData.conditional_logic;
          
          const { error: fallbackError } = await supabase
            .from('forms')
            .update(fallbackData)
            .eq('id', formId)
            .select();

          if (fallbackError) throw fallbackError;
        }

        // Delete existing fields
        await supabase
          .from('form_fields')
          .delete()
          .eq('form_id', formId);
      } else {
        // Create new form
        let formData = {
          name: formName,
          description: formDesc,
          type: finalType
        };

        // Add conditional_logic if it exists and has data
        if (conditionalLogic && conditionalLogic.length > 0) {
          formData.conditional_logic = conditionalLogic;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          formData.user_id = user.id;
        } else {
          alert('Please log in to save forms');
          setLoading(false);
          return;
        }

        try {
          const { data, error } = await supabase
            .from('forms')
            .insert([formData])
            .select();

          if (error) throw error;
          savedFormId = data[0].id;
        } catch (error) {
          console.error('Error creating form:', error);
          // Fallback: try without conditional_logic
          const fallbackData = { ...formData };
          delete fallbackData.conditional_logic;
          
          const { data, error: fallbackError } = await supabase
            .from('forms')
            .insert([fallbackData])
            .select();

          if (fallbackError) throw fallbackError;
          savedFormId = data[0].id;
        }
      }

      // Insert fields
      const fieldsToInsert = fields.map((field, index) => ({
        form_id: savedFormId,
        label: field.label,
        field_type: field.field_type,
        is_required: field.is_required,
        is_readonly: field.is_readonly,
        display_order: index,
        options: field.options
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsToInsert);

      if (fieldsError) throw fieldsError;

      // Update URL and show success
      if (!isEditing) {
        navigate(`/form-builder/${savedFormId}`, { replace: true });
      }
      
      alert('Form saved successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewValueChange = (fieldId, value) => {
    setPreviewValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Drag and drop functions
  const handleDragStart = (e, index) => {
    setDraggedField(index);
    document.body.classList.add('dragging');
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'field',
      fieldIndex: index
    }));
    e.dataTransfer.effectAllowed = 'move';
    console.log('Field drag started:', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    
    // Try to determine if it's a widget or field drag for visual feedback
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const dragData = JSON.parse(data);
        e.dataTransfer.dropEffect = dragData.type === 'widget' ? 'copy' : 'move';
      } else {
        // Fallback for cases where getData doesn't work during dragover
        e.dataTransfer.dropEffect = draggedField !== null ? 'move' : 'copy';
      }
    } catch {
      // Default behavior
      e.dataTransfer.dropEffect = draggedField !== null ? 'move' : 'copy';
    }
  };

  const handleDrop = (e, dropIndex, dropPosition = 'after') => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop event triggered at index:', dropIndex, 'position:', dropPosition);
    
    // Check if it's a widget from the library or field reordering
    try {
      const data = e.dataTransfer.getData('application/json');
      console.log('Drop data:', data);
      if (data) {
        const dragData = JSON.parse(data);
        console.log('Parsed drag data:', dragData);
        
        if (dragData.type === 'widget') {
          // Handle widget drop - create new field
          const widget = dragData.widget;
          console.log('Creating field from widget:', widget);
          const newField = {
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label: widget.name,
            field_type: widget.fieldType,
            is_required: false,
            is_readonly: false,
            options: widget.defaultOptions ? JSON.stringify(widget.defaultOptions) : '',
            placeholder: `Enter ${widget.name.toLowerCase()}`,
            min: widget.customAttributes?.min || '',
            max: widget.customAttributes?.max || '',
            step: widget.customAttributes?.step || '',
            accept: widget.fieldType === 'file' ? '*/*' : '',
            maxSize: widget.fieldType === 'file' ? '10MB' : '',
            allowMultiple: widget.fieldType === 'file' ? false : undefined,
            display_order: dropIndex,
            ...widget.customAttributes
          };
          
          console.log('New field created:', newField);
          // Insert at the specified position
          const newFields = [...fields];
          const insertIndex = dropPosition === 'before' ? dropIndex : dropIndex + 1;
          newFields.splice(insertIndex, 0, newField);
          console.log('Updated fields array:', newFields);
          setFields(newFields);
          setDraggedField(null);
          return;
        } else if (dragData.type === 'field') {
          // Handle field reordering
          const sourceIndex = dragData.fieldIndex;
          console.log('Reordering field from index:', sourceIndex, 'to index:', dropIndex, 'position:', dropPosition);
          
          if (sourceIndex === null || sourceIndex === undefined || sourceIndex === dropIndex) {
            console.log('Invalid reorder operation');
            setDraggedField(null);
            return;
          }

          const newFields = [...fields];
          const draggedItem = newFields[sourceIndex];
          
          // Calculate the target index
          let targetIndex;
          if (dropPosition === 'before') {
            targetIndex = dropIndex;
          } else { // 'after'
            targetIndex = dropIndex + 1;
          }
          
          // Remove the dragged item
          newFields.splice(sourceIndex, 1);
          
          // Adjust target index if needed (if we removed an item before the target)
          if (sourceIndex < targetIndex) {
            targetIndex--;
          }
          
          // Ensure target index is within bounds
          targetIndex = Math.max(0, Math.min(targetIndex, newFields.length));
          
          // Insert at the new position
          newFields.splice(targetIndex, 0, draggedItem);
          
          console.log(`Field "${draggedItem.label}" moved from position ${sourceIndex} to ${targetIndex}`);
          setFields(newFields);
          setDraggedField(null);
          return;
        }
      }
    } catch (err) {
      console.log('Error processing drop:', err);
    }
    
    // Fallback: if no JSON data but draggedField state is set
    if (draggedField !== null && draggedField !== dropIndex) {
      console.log('Fallback: reordering using draggedField state from', draggedField, 'to', dropIndex);
      const newFields = [...fields];
      const draggedItem = newFields[draggedField];
      
      // Calculate target index
      let targetIndex;
      if (dropPosition === 'before') {
        targetIndex = dropIndex;
      } else {
        targetIndex = dropIndex + 1;
      }
      
      // Remove dragged item
      newFields.splice(draggedField, 1);
      
      // Adjust target index if needed
      if (draggedField < targetIndex) {
        targetIndex--;
      }
      
      // Ensure target index is within bounds
      targetIndex = Math.max(0, Math.min(targetIndex, newFields.length));
      
      // Insert at new position
      newFields.splice(targetIndex, 0, draggedItem);
      
      console.log(`Field "${draggedItem.label}" moved from position ${draggedField} to ${targetIndex}`);
      setFields(newFields);
    }
    
    setDraggedField(null);
    
    // Clean up any lingering drop zone visual states
    setTimeout(() => {
      const dropZones = document.querySelectorAll('.drop-zone-active');
      dropZones.forEach(zone => {
        zone.classList.remove('drop-zone-active');
      });
    }, 50);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
    document.body.classList.remove('dragging');
    
    // Clean up any lingering drop zone visual states
    setTimeout(() => {
      const dropZones = document.querySelectorAll('.drop-zone-active');
      dropZones.forEach(zone => {
        zone.classList.remove('drop-zone-active');
      });
    }, 100);
  };

  const moveField = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const newFields = [...fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    setFields(newFields);
  };

  // Field editing functions
  const updateFieldProperty = (index, property, value) => {
    const newFields = [...fields];
    
    // If changing field type, also update the label to match the new type if it's a default label
    if (property === 'field_type') {
      const currentField = newFields[index];
      const fieldTypeLabels = {
        'text': 'Text Input',
        'email': 'Email Address',
        'number': 'Number',
        'tel': 'Phone Number',
        'url': 'Website URL',
        'password': 'Password',
        'textarea': 'Message',
        'select': 'Dropdown Selection',
        'radio': 'Radio Buttons',
        'checkbox': 'Checkboxes',
        'date': 'Date',
        'time': 'Time',
        'datetime-local': 'Date & Time',
        'file': 'File Upload',
        'range': 'Range Slider',
        'color': 'Color Picker'
      };
      
      // Check if current label is a default label or empty, then update it
      const defaultLabels = Object.values(fieldTypeLabels);
      const currentLabel = currentField.label || '';
      
      if (!currentLabel || defaultLabels.includes(currentLabel) || currentLabel.match(/^(Field \d+|Text Input|Email Address|Number|Phone Number|Website URL|Password|Message|Dropdown Selection|Radio Buttons|Checkboxes|Date|Time|Date & Time|File Upload|Range Slider|Color Picker)$/)) {
        newFields[index] = { 
          ...newFields[index], 
          [property]: value,
          label: fieldTypeLabels[value] || value.charAt(0).toUpperCase() + value.slice(1)
        };
      } else {
        // Keep existing custom label
        newFields[index] = { ...newFields[index], [property]: value };
      }
      
      // Clear field-specific properties when changing types
      if (value !== 'number' && value !== 'range') {
        delete newFields[index].min;
        delete newFields[index].max;
        delete newFields[index].step;
      }
      if (!['text', 'email', 'number', 'tel', 'url', 'password', 'textarea'].includes(value)) {
        delete newFields[index].placeholder;
      }
      if (!['select', 'radio', 'checkbox'].includes(value)) {
        newFields[index].options = '';
      } else if (!newFields[index].options) {
        // Add default options for selection fields
        newFields[index].options = JSON.stringify(['Option 1', 'Option 2', 'Option 3']);
      }
    } else {
      newFields[index] = { ...newFields[index], [property]: value };
    }
    
    setFields(newFields);
  };

  const addFieldOption = (fieldIndex) => {
    const newFields = [...fields];
    let options = [];
    
    // Handle both array and JSON string formats
    if (newFields[fieldIndex].options) {
      if (Array.isArray(newFields[fieldIndex].options)) {
        options = [...newFields[fieldIndex].options];
      } else {
        try {
          options = JSON.parse(newFields[fieldIndex].options);
        } catch (e) {
          options = [];
        }
      }
    }
    
    options.push(''); // Add empty string instead of preset text
    newFields[fieldIndex].options = options;
    setFields(newFields);
  };

  const removeFieldOption = (fieldIndex, optionIndex) => {
    const newFields = [...fields];
    let options = [];
    
    // Handle both array and JSON string formats
    if (newFields[fieldIndex].options) {
      if (Array.isArray(newFields[fieldIndex].options)) {
        options = [...newFields[fieldIndex].options];
      } else {
        try {
          options = JSON.parse(newFields[fieldIndex].options);
        } catch (e) {
          options = [];
        }
      }
    }
    
    options.splice(optionIndex, 1);
    newFields[fieldIndex].options = options;
    setFields(newFields);
  };

  const updateFieldOption = (fieldIndex, optionIndex, value) => {
    const newFields = [...fields];
    let options = [];
    
    // Handle both array and JSON string formats
    if (newFields[fieldIndex].options) {
      if (Array.isArray(newFields[fieldIndex].options)) {
        options = [...newFields[fieldIndex].options];
      } else {
        try {
          options = JSON.parse(newFields[fieldIndex].options);
        } catch (e) {
          options = [];
        }
      }
    }
    
    options[optionIndex] = value;
    newFields[fieldIndex].options = options;
    setFields(newFields);
  };

  // Template functions
  const handleTemplateSelect = (template) => {
    setName(template.name);
    setDescription(template.description);
    setType(template.id); // Use template.id instead of template.category
    setFields(template.fields.map((field, index) => ({
      ...field,
      id: `field-${Date.now()}-${index}`,
      display_order: index,
      // Convert array options to JSON string for consistency
      options: Array.isArray(field.options) ? JSON.stringify(field.options) : field.options
    })));
    setShowTemplates(false); // Close the template modal after selection
  };

  const tabs = [
    {
      id: 'design',
      name: 'Design',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      )
    },
    {
      id: 'preview',
      name: 'Preview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    {
      id: 'logic',
      name: 'Logic',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'share',
      name: 'Share',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      )
    }
  ];

  if (loading && isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
          <p className="text-gray-300">Loading form...</p>
        </div>
      </div>
    );
  }

  // Handle drop on empty form
  const handleEmptyFormDrop = (e) => {
    e.preventDefault();
    console.log('Empty form drop triggered');
    
    try {
      const data = e.dataTransfer.getData('application/json');
      console.log('Empty form drop data:', data);
      if (data) {
        const dragData = JSON.parse(data);
        console.log('Empty form parsed data:', dragData);
        if (dragData.type === 'widget') {
          // Handle widget drop - create new field
          const widget = dragData.widget;
          console.log('Creating first field from widget:', widget);
          const newField = {
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label: widget.name,
            field_type: widget.fieldType,
            is_required: false,
            is_readonly: false,
            options: widget.defaultOptions ? JSON.stringify(widget.defaultOptions) : '',
            placeholder: `Enter ${widget.name.toLowerCase()}`,
            min: widget.customAttributes?.min || '',
            max: widget.customAttributes?.max || '',
            step: widget.customAttributes?.step || '',
            accept: widget.fieldType === 'file' ? '*/*' : '',
            maxSize: widget.fieldType === 'file' ? '10MB' : '',
            allowMultiple: widget.fieldType === 'file' ? false : undefined,
            display_order: 0,
            ...widget.customAttributes
          };
          
          console.log('First field created:', newField);
          setFields([newField]);
        }
      }
    } catch (err) {
      console.log('Empty form drop error:', err);
    }
  };

  // Render form preview content (reusable for both preview card and modal)
  const renderFormPreview = (isModal = false) => {
    if (fields.length === 0) {
      return (
        <div 
          className="text-center py-12 border-2 border-dashed border-gray-600/50 rounded-lg hover:border-cyan-400/50 hover:bg-gray-800/30 transition-colors backdrop-blur-sm"
          onDragOver={handleDragOver}
          onDrop={handleEmptyFormDrop}
        >
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No fields yet</h3>
          <p className="text-gray-300">Add fields from the sidebar to start building your form</p>
          <p className="text-gray-400 text-sm mt-2">or drag and drop fields here</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-8">
        {/* Drop zone at the beginning */}
        
        
        {fields.map((field, index) => (
          <div key={field.id || index} className="relative">
            {/* Top Drop Zone - positioned OUTSIDE the field */}
            <div
              className="absolute -top-5 left-0 right-0 h-4 bg-transparent hover:bg-cyan-500/10 border-2 border-dashed border-transparent hover:border-cyan-400/50 transition-all rounded z-20 backdrop-blur-sm"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                handleDrop(e, index, 'before');
                e.currentTarget.classList.remove('drop-zone-active');
              }}
              onDragEnter={(e) => e.currentTarget.classList.add('drop-zone-active')}
              onDragLeave={(e) => {
                // Only remove class if we're actually leaving the element
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  e.currentTarget.classList.remove('drop-zone-active');
                }
              }}
              title="Drop here to insert before this field"
            />
            
            <div
              className={`drag-field-item relative group border-2 border-dashed border-gray-600/50 bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 transition-colors ${
                'cursor-move hover:border-cyan-400/50'
              } ${selectedField === index ? 'border-cyan-400 bg-cyan-500/10 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]' : ''} ${draggedField === index ? 'opacity-50 border-cyan-400/50 bg-cyan-500/10 scale-95 dragging' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedField(selectedField === index ? null : index);
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Action Buttons - show in both preview and modal */}
              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateField(index);
                  }}
                  className="p-1 bg-gray-700/80 backdrop-blur-sm rounded shadow-sm border border-gray-600/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all duration-200"
                  title="Duplicate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(index);
                  }}
                  className="p-1 bg-gray-700/80 backdrop-blur-sm rounded shadow-sm border border-gray-600/50 text-gray-400 hover:text-red-400 hover:border-red-400/50 transition-all duration-200"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Field Preview */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  {field.label}
                  {field.is_required && <span className="text-red-400 ml-1">*</span>}
                </label>
              
              {field.field_type === 'text' && (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                  disabled={!isModal}
                />
              )}
              
              {field.field_type === 'textarea' && (
                <textarea
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                  disabled={!isModal}
                />
              )}
              
              {field.field_type === 'select' && (
                <select className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300" disabled={!isModal}>
                  <option>Select an option</option>
                  {(() => {
                    const options = Array.isArray(field.options) ? field.options : 
                      (field.options ? JSON.parse(field.options || '[]') : []);
                    return options.map((option, optIndex) => (
                      <option key={optIndex} value={option} className="bg-gray-700 text-white">{option}</option>
                    ));
                  })()}
                </select>
              )}
              
              {field.field_type === 'radio' && (
                <div className="space-y-2">
                  {(() => {
                    const options = Array.isArray(field.options) ? field.options : 
                      (field.options ? JSON.parse(field.options || '[]') : []);
                    return options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center">
                        <input
                          type="radio"
                          name={`radio-${field.id || index}-${isModal ? 'modal' : 'preview'}`}
                          className="mr-2 text-cyan-400 bg-gray-700 border-purple-600 focus:ring-cyan-400"
                          disabled={!isModal}
                        />
                        <label className="text-sm text-purple-300">{option}</label>
                      </div>
                    ));
                  })()}
                </div>
              )}
              
              {field.field_type === 'checkbox' && (
                <div className="space-y-2">
                  {(() => {
                    const options = Array.isArray(field.options) ? field.options : 
                      (field.options ? JSON.parse(field.options || '[]') : []);
                    return options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2 text-cyan-400 bg-gray-700 border-purple-600 focus:ring-cyan-400"
                          disabled={!isModal}
                        />
                        <label className="text-sm text-purple-300">{option}</label>
                      </div>
                    ));
                  })()}
                </div>
              )}
              
              {['email', 'number', 'tel', 'url', 'password', 'date', 'time', 'datetime-local', 'color', 'range', 'file'].includes(field.field_type) && (
                <input
                  type={field.field_type}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                  disabled={!isModal}
                />
              )}

              {field.helpText && (
                <p className="text-sm text-purple-400 mt-1">{field.helpText}</p>
              )}
              </div>
            </div>
            
            {/* Bottom Drop Zone - positioned OUTSIDE the field */}
            <div
              className="absolute -bottom-2 left-0 right-0 h-4 bg-transparent hover:bg-purple-50 border-2 border-dashed border-transparent hover:border-purple-400 transition-all rounded z-20"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                handleDrop(e, index, 'after');
                e.currentTarget.classList.remove('drop-zone-active');
              }}
              onDragEnter={(e) => e.currentTarget.classList.add('drop-zone-active')}
              onDragLeave={(e) => {
                // Only remove class if we're actually leaving the element
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  e.currentTarget.classList.remove('drop-zone-active');
                }
              }}
              title="Drop here to insert after this field"
            />
          </div>
        ))}
      </div>
    );
  };

  // Field Manager Modal Component
  const FieldManagerModal = () => {
    const [draggedIndex, setDraggedIndex] = useState(null);
    
    // Handle escape key to close modal
    useEffect(() => {
      if (!showFieldManager) return;
      
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowFieldManager(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, []); // Remove showFieldManager dependency
    
    if (!showFieldManager) return null;

    const handleDragStart = (e, index) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
      e.preventDefault();
      
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        return;
      }

      moveField(draggedIndex, dropIndex);
      setDraggedIndex(null);
    };

    const handleDragEnd = () => {
      setDraggedIndex(null);
    };

    return (
      <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
           onClick={(e) => {
             if (e.target === e.currentTarget) {
               setShowFieldManager(false);
             }
           }}>
        <div className="bg-gray-800/90 backdrop-blur-sm border border-purple-700/30 rounded-lg shadow-2xl shadow-purple-900/50 w-full max-w-3xl h-[90vh] flex flex-col" 
             onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-800/30 flex-shrink-0">
            <h3 className="text-xl font-semibold text-white flex items-center space-x-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              <span>📋</span>
              <span>Manage Form Fields</span>
            </h3>
            <button
              onClick={() => setShowFieldManager(false)}
              className="p-2 text-purple-400 hover:text-cyan-300 rounded-lg hover:bg-purple-800/30 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="flex-1 min-h-0 flex flex-col">
            {fields.length === 0 ? (
              <div className="text-center py-12 text-purple-300 p-6">
                <svg className="mx-auto h-16 w-16 text-purple-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xl font-medium mb-2 text-white">No fields added yet</p>
                <p className="text-purple-400">Add fields using the sidebar to see them here</p>
              </div>
            ) : (
              <>
                <div className="p-6 pb-2 flex-shrink-0">
                  <div className="text-sm text-purple-300 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Drag fields to reorder or use the arrow buttons</span>
                  </div>
                </div>
                
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id || index}>
                        {/* Drop zone before each field */}
                        <div
                          className="h-2 transition-all duration-200 ease-in-out"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          style={{
                            backgroundColor: draggedIndex !== null && draggedIndex !== index ? '#f3e8ff' : 'transparent',
                            border: draggedIndex !== null && draggedIndex !== index ? '2px dashed #a855f7' : 'none',
                            borderRadius: '4px'
                          }}
                        />
                        
                        <div
                          className={`group cursor-move transition-all duration-200 ${
                            draggedIndex === index ? 'opacity-50 scale-95' : ''
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-purple-700/30 hover:border-purple-600/40 hover:bg-gray-700/70 transition-all duration-300 shadow-lg shadow-purple-900/20">
                            {/* Drag Handle */}
                            <div className="flex-shrink-0 cursor-move text-purple-400 hover:text-cyan-300">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                <path d="M6 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM6 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                <path d="M14 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM14 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM15.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                              </svg>
                            </div>

                            {/* Field Position */}
                            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-600 to-cyan-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium shadow-lg">
                              {index + 1}
                            </div>

                            {/* Field Info */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                                <h4 className="text-xs sm:text-sm font-medium text-white truncate bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                  {field.label}
                                </h4>
                                {field.is_required && (
                                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-red-600 to-pink-600 text-white flex-shrink-0 shadow-lg">
                                    Required
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-purple-300">
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-purple-700 to-cyan-700 text-white rounded text-xs border border-purple-600">
                                  {field.field_type.charAt(0).toUpperCase() + field.field_type.slice(1)}
                                </span>
                                {field.placeholder && (
                                  <span className="truncate hidden sm:inline text-purple-300">• {field.placeholder}</span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0">
                              {/* Move Up */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (index > 0) {
                                    moveField(index, index - 1);
                                  }
                                }}
                                disabled={index === 0}
                                className="p-1.5 sm:p-2 text-purple-400 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-700/70 transition-all duration-300"
                                title="Move up"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              
                              {/* Move Down */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (index < fields.length - 1) {
                                    moveField(index, index + 1);
                                  }
                                }}
                                disabled={index === fields.length - 1}
                                className="p-1.5 sm:p-2 text-purple-400 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-700/70 transition-all duration-300"
                                title="Move down"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {/* Duplicate */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateField(index);
                                }}
                                className="p-1.5 sm:p-2 text-purple-400 hover:text-green-400 rounded-lg hover:bg-gray-700/70 transition-all duration-300"
                                title="Duplicate field"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to delete "${field.label}"?`)) {
                                    removeField(index);
                                  }
                                }}
                                className="p-1.5 sm:p-2 text-purple-400 hover:text-red-400 rounded-lg hover:bg-gray-700/70 transition-all duration-300"
                                title="Delete field"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Drop zone at the end */}
                    <div
                      className="h-2 transition-all duration-200 ease-in-out"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, fields.length)}
                      style={{
                        backgroundColor: draggedIndex !== null ? '#f3e8ff' : 'transparent',
                        border: draggedIndex !== null ? '2px dashed #a855f7' : 'none',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-6 border-t border-purple-800/30 bg-gray-800/50 flex-shrink-0">
            <div className="text-sm text-purple-300">
              <span className="font-medium text-white">{fields.length}</span> field{fields.length !== 1 ? 's' : ''} in your form
            </div>
            <button
              onClick={() => setShowFieldManager(false)}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-all duration-300 font-medium shadow-lg hover:shadow-purple-500/40"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-form-builder bg-gradient-to-br from-gray-900 via-purple-950 to-blue-950 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="bg-gray-900/90 backdrop-blur-md border-b border-purple-800/30 flex-shrink-0 z-40 shadow-lg shadow-purple-900/20">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-2 lg:py-4">
            {/* Mobile Left Section */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-1 lg:space-x-2 text-purple-300 hover:text-cyan-300 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium text-sm lg:text-base hidden sm:inline">Back</span>
              </Link>
              <div className="h-4 lg:h-6 w-px bg-purple-700/50 hidden sm:block"></div>
              <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent truncate">
                {isEditing ? 'Edit Form' : 'Create Form'}
              </h1>
            </div>

            {/* Mobile Right Section */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Mobile Settings Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden bg-purple-800/50 backdrop-blur-sm border border-purple-600/30 text-purple-200 p-2 rounded-lg hover:bg-purple-700/60 hover:border-purple-500/50 hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                title="Open Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </button>

              {/* Template Button */}
              {!isEditing && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="hidden sm:flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 text-xs lg:text-sm bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-md hover:from-purple-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 h-10 border border-purple-500/30"
                >
                  <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="hidden sm:inline">Template</span>
                </button>
              )}

              {/* Mobile Template Button */}
              {!isEditing && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="sm:hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-2 rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 h-10 border border-purple-500/30"
                  title="Use Template"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </button>
              )}

              {/* Save Button */}
              <button
                onClick={saveForm}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-md text-xs sm:text-sm lg:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sm:space-x-1 h-10 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 border border-green-500/30"
              >
                {loading && (
                  <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className="hidden sm:inline">{isEditing ? 'Update' : 'Save'}</span>
                <div className="sm:hidden flex items-center justify-center w-full h-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1m1 0h4m-4 0a1 1 0 011-1h2a1 1 0 011 1m-6 0h6" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Desktop Sidebar - Hidden on Mobile */}
          <div className="hidden lg:flex w-80 xl:w-96 flex-shrink-0 bg-gray-900/90 backdrop-blur-md border-r border-purple-800/30 overflow-y-auto shadow-lg shadow-purple-900/20">
            <div className="p-4 space-y-4 w-full">
              {/* Desktop Form Settings */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-700/30 rounded-lg p-4 shadow-lg shadow-purple-900/20">
                <h3 className="text-base font-semibold text-white mb-3 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Form Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Form Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter form name"
                      className="w-full px-3 py-2 text-sm bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter form description"
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300 resize-vertical"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Form Type</label>
                    <select
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value);
                        if (e.target.value !== 'other') setCustomType('');
                      }}
                      className="w-full px-3 py-2 text-sm bg-gray-900/70 border border-purple-600/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300"
                    >
                      <option value="">Select type</option>
                      <option value="contact">Contact Form</option>
                      <option value="survey">Survey</option>
                      <option value="registration">Registration</option>
                      <option value="feedback">Feedback</option>
                      <option value="application">Application</option>
                      <option value="other">Other</option>
                    </select>
                    {type === 'other' && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={customType}
                          onChange={(e) => setCustomType(e.target.value)}
                          placeholder="Enter custom form type"
                          className="w-full px-3 py-2 text-sm bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop AI Assistant */}
              <div className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-cyan-900/50 backdrop-blur-sm border border-purple-700/30 rounded-lg p-4 relative overflow-hidden shadow-lg shadow-purple-900/20">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 animate-pulse"></div>
                <div className="relative z-10">
                  <h3 className="text-base font-semibold text-white mb-3 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                      <svg className="w-5 h-5 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                        <path d="M12 1l2 9L24 12l-10 2L12 23l-2-9L0 12l10-2L12 1z"/>
                        <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">AI Assistant</span>
                  </h3>
                  <div className="space-y-3">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your form..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300 resize-vertical"
                    />
                    <button
                      onClick={handleAIGenerate}
                      disabled={loadingAI || !prompt.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white px-4 py-2 text-sm rounded-md font-medium hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 border border-purple-500/30"
                    >
                      {loadingAI ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                          <path d="M12 3l1.5 7.5L21 12l-7.5 1.5L12 21l-1.5-7.5L3 12l7.5-1.5L12 3z"/>
                          <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                        </svg>
                      )}
                      <span>{loadingAI ? 'Generating...' : 'Generate Fields'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-gray-900/90 backdrop-blur-md overflow-hidden" style={{ maxHeight: '100vh' }}>
            {/* Tab Navigation */}
            <div className="border-b border-purple-800/30 flex-shrink-0 shadow-lg shadow-purple-900/20">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 lg:space-x-2 py-3 px-3 lg:px-4 text-xs sm:text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                        : 'border-transparent text-purple-300 hover:text-cyan-300 hover:border-purple-500/50 hover:bg-purple-900/20'
                    }`}
                  >
                    <span className="text-base lg:text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline lg:inline">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden mobile-tab-content">
              {activeTab === 'design' && (
                <div className="flex h-full">
                  {/* Form Canvas */}
                  <div className="flex-1 flex flex-col">
                    {/* Form Header - Fixed */}
                    <div className="flex-shrink-0 p-2 sm:p-3 lg:p-6 pb-0">
                      <div className="max-w-full lg:max-w-2xl mx-auto">
                        <div>
                          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1 sm:mb-2">{name || 'Untitled Form'}</h2>
                          {(type || customType) && (
                            <span className="inline-block bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                              {type === 'other' ? customType : type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Form Fields - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-2 sm:px-3 lg:px-6">
                      <div className="max-w-full lg:max-w-2xl mx-auto">
                        <div className="space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                          {fields.length > 0 ? (
                            fields.map((field, index) => (
                            <div
                              key={field.id || index}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                              onDragEnd={handleDragEnd}
                              className={`relative group border-2 border-dashed border-purple-600/50 bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 cursor-move hover:border-cyan-400/70 hover:bg-gray-700/60 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 ${
                                selectedField === index ? 'border-cyan-400 bg-cyan-900/20 shadow-lg shadow-cyan-500/30' : ''
                              } ${draggedField === index ? 'opacity-50' : ''} mobile-field-card`}
                              onClick={() => setSelectedField(selectedField === index ? null : index)}
                            >
                              {/* Mobile-Optimized Drag Handle */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity lg:flex hidden">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateField(index);
                                    }}
                                    className="p-1 text-purple-400 hover:text-cyan-300 transition-colors"
                                    title="Duplicate"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeField(index);
                                    }}
                                    className="p-1 text-purple-400 hover:text-red-400 transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                  <div className="cursor-move text-purple-400 hover:text-cyan-300 transition-colors" title="Drag to reorder">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Mobile Action Buttons */}
                              <div className="lg:hidden absolute top-2 right-2 flex space-x-1 mobile-field-actions">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateField(index);
                                  }}
                                  className="p-2 bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400/50 hover:bg-cyan-600/20 transition-all duration-300"
                                  title="Duplicate"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeField(index);
                                  }}
                                  className="p-2 bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-red-500/30 text-red-300 hover:text-white hover:border-red-400/50 hover:bg-red-600/20 transition-all duration-300"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>

                              {/* Field Preview */}
                              <div className="pr-16 lg:pr-20">
                                <label className="block text-sm font-medium text-purple-300 mb-2">
                                  {field.label}
                                  {field.is_required && <span className="text-red-400 ml-1">*</span>}
                                </label>
                                
                                {field.field_type === 'text' && (
                                  <input
                                    type="text"
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}
                                
                                {field.field_type === 'textarea' && (
                                  <textarea
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}
                                
                                {field.field_type === 'select' && (
                                  <select className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300" disabled>
                                    <option>Select an option</option>
                                    {(() => {
                                      try {
                                        const options = Array.isArray(field.options) ? field.options : 
                                          (field.options ? JSON.parse(field.options || '[]') : []);
                                        return options.length > 0 ? options.map((option, optIndex) => (
                                          <option key={optIndex} value={option}>{option}</option>
                                        )) : (
                                          <>
                                            <option value="option1">Option 1</option>
                                            <option value="option2">Option 2</option>
                                            <option value="option3">Option 3</option>
                                          </>
                                        );
                                      } catch (e) {
                                        console.error('Error parsing options:', e);
                                        return (
                                          <>
                                            <option value="option1">Option 1</option>
                                            <option value="option2">Option 2</option>
                                            <option value="option3">Option 3</option>
                                          </>
                                        );
                                      }
                                    })()}
                                  </select>
                                )}
                                
                                {field.field_type === 'radio' && (
                                  <div className="space-y-2">
                                    {(() => {
                                      const options = Array.isArray(field.options) ? field.options : 
                                        (field.options ? JSON.parse(field.options || '[]') : []);
                                      const displayOptions = options.length > 0 ? options : ['Option 1', 'Option 2'];
                                      return displayOptions.map((option, optIndex) => (
                                        <label key={optIndex} className="flex items-center text-purple-300">
                                          <input type="radio" name={`radio-${index}`} className="mr-2 text-cyan-400 bg-gray-700 border-purple-600 focus:ring-cyan-400" disabled />
                                          <span>{option}</span>
                                        </label>
                                      ));
                                    })()}
                                  </div>
                                )}
                                
                                {field.field_type === 'checkbox' && (
                                  <div className="space-y-2">
                                    {(() => {
                                      const options = Array.isArray(field.options) ? field.options : 
                                        (field.options ? JSON.parse(field.options || '[]') : []);
                                      const displayOptions = options.length > 0 ? options : ['Option 1', 'Option 2'];
                                      return displayOptions.map((option, optIndex) => (
                                        <label key={optIndex} className="flex items-center text-purple-300">
                                          <input type="checkbox" className="mr-2 text-cyan-400 bg-gray-700 border-purple-600 focus:ring-cyan-400" disabled />
                                          <span>{option}</span>
                                        </label>
                                      ));
                                    })()}
                                  </div>
                                )}
                                
                                {field.field_type === 'email' && (
                                  <input
                                    type="email"
                                    placeholder={field.placeholder || 'Enter email address'}
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}
                                
                                {field.field_type === 'number' && (
                                  <input
                                    type="number"
                                    placeholder={field.placeholder}
                                    min={field.min}
                                    max={field.max}
                                    step={field.step}
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}

                                {field.field_type === 'tel' && (
                                  <input
                                    type="tel"
                                    placeholder={field.placeholder || 'Enter phone number'}
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}

                                {field.field_type === 'url' && (
                                  <input
                                    type="url"
                                    placeholder={field.placeholder || 'Enter URL'}
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}

                                {field.field_type === 'password' && (
                                  <input
                                    type="password"
                                    placeholder={field.placeholder || 'Enter password'}
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}

                                {field.field_type === 'time' && (
                                  <input
                                    type="time"
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}

                                {field.field_type === 'datetime-local' && (
                                  <input
                                    type="datetime-local"
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}

                                {field.field_type === 'range' && (
                                  <div>
                                    <input
                                      type="range"
                                      min={field.min || "0"}
                                      max={field.max || "100"}
                                      step={field.step || "1"}
                                      defaultValue={field.min ? field.min : "50"}
                                      className="w-full"
                                      disabled
                                    />
                                    <div className="flex justify-between text-xs text-purple-300 mt-1">
                                      <span>{field.min || "0"}</span>
                                      <span>{Math.round((parseInt(field.min || "0") + parseInt(field.max || "100")) / 2)}</span>
                                      <span>{field.max || "100"}</span>
                                    </div>
                                  </div>
                                )}

                                {field.field_type === 'color' && (
                                  <input
                                    type="color"
                                    defaultValue="#000000"
                                    className="w-full h-10 bg-gray-900/70 border border-purple-600/50 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}
                                
                                {field.field_type === 'date' && (
                                  <input
                                    type="date"
                                    className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                                    disabled
                                  />
                                )}
                                
                                {field.field_type === 'file' && (
                                  <div className="border-2 border-dashed border-purple-600/50 bg-gray-800/30 rounded-lg p-4 text-center">
                                    <svg className="mx-auto h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm text-purple-300 mt-2">Click to upload or drag and drop</p>
                                  </div>
                                )}

                                {field.helpText && (
                                  <p className="text-xs text-purple-400 mt-1">{field.helpText}</p>
                                )}
                                
                                {/* Mobile tap to edit indicator */}
                                <div className="mt-2 text-xs text-purple-400 flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Tap to edit properties
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                            <div className="text-center text-gray-500 max-w-sm mx-auto px-4">
                              <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-gray-400 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <p className="text-base sm:text-lg lg:text-xl font-medium mb-1 sm:mb-2">Start building your form</p>
                              <p className="text-xs sm:text-sm lg:text-base text-gray-400">
                                Tap the + button to add fields
                              </p>
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Floating Action Buttons */}
                    <div className="lg:hidden fixed bottom-4 right-4 z-40 flex flex-col space-y-3 mobile-fab-stack">
                      {/* Manage Fields Button */}
                      <button
                        onClick={() => setShowFieldManager(true)}
                        className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors touch-friendly flex items-center justify-center"
                        title="Manage & Reorder Fields"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </button>
                      
                      {/* Add Fields Button */}
                      <button
                        onClick={() => setIsMobileFieldsOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-4 rounded-full shadow-lg hover:from-purple-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:shadow-purple-500/25 touch-friendly flex items-center justify-center border border-purple-500/30"
                        title="Add Fields"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    {/* Desktop Sidebar Layout */}
                    <div className="hidden lg:block desktop-form-builder relative h-screen bg-gray-900/95 backdrop-blur-md">
                      {/* Floating Hamburger Button - Only shown when sidebar is collapsed */}
                      {!isDesktopSidebarOpen && (
                        <button
                          onClick={() => setIsDesktopSidebarOpen(true)}
                          className="fixed top-4 left-4 z-50 p-3 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg border border-purple-700/30 hover:bg-gray-800/90 hover:border-purple-600/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25"
                          title="Open sidebar"
                        >
                          <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                      )}
                      
                      <div className="flex h-full">{/* Left Sidebar - Add Fields */}
                        {isDesktopSidebarOpen && (
                          <div className="w-64 bg-gray-900/90 backdrop-blur-md border-r border-purple-800/30 desktop-sidebar transition-all duration-300 shadow-lg shadow-purple-900/20">
                            <div className="p-4 border-b border-purple-800/30">
                              <div className="flex items-center justify-right space-x-10">
                                <button
                                  onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                                  className="rounded-lg hover:bg-purple-800/30 transition-colors p-2"
                                  title={isDesktopSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                                >
                                  <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                </button>
                                <div className="ml-3">
                                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                    <span>🧩</span>
                                    <span>Add Fields</span>
                                  </h3>
                                  <p className="text-sm text-purple-300 mt-1">Drag or click to add</p>
                                </div>
                              </div>
                            </div>
                            <div className="desktop-sidebar-content">
                              <WidgetLibrary onAddField={addField} className="border-0 p-0 widget-library" />
                            </div>
                          </div>
                        )}

                        {/* Main Content Area */}
                        <div className="flex-1 desktop-main-content bg-gray-900/90 backdrop-blur-md">
                          <div className="h-full bg-gray-900/50 rounded-lg">
                            <div className="max-w-2xl mx-auto h-full">
                              <div 
                                className={`bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-purple-700/30 p-6 form-preview-card ${isScrolling ? 'scrolling' : ''} hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-300 h-full min-h-screen`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => {
                                  // If there are no fields, use empty form drop handler
                                  if (fields.length === 0) {
                                    handleEmptyFormDrop(e);
                                  } else {
                                    // Otherwise, add to the end
                                    handleDrop(e, fields.length);
                                  }
                                }}
                              >
                                <div className="mb-6 flex-shrink-0 relative">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h2 className="text-xl font-bold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">Form Preview</h2>
                                      <p className="text-sm text-purple-300">Click on any field to edit its properties</p>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => setShowFieldManager(true)}
                                        className="p-2 text-purple-300 hover:text-cyan-300 hover:bg-purple-800/30 rounded-lg transition-all duration-300 border border-purple-600/30 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                                        title="Manage & Reorder Fields"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="p-2 text-purple-300 hover:text-cyan-300 hover:bg-purple-800/30 rounded-lg transition-all duration-300 border border-purple-600/30 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                                        title="Open in fullscreen"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                              {renderFormPreview(false)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Field Properties Panel */}
                  {selectedField !== null && (
                    <div className="hidden lg:block w-80 bg-gray-800/90 backdrop-blur-sm border-l border-purple-800/30 desktop-properties-panel">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">Field Properties</h3>
                          <p className="text-sm text-purple-300">Configure the selected field</p>
                        </div>
                        <button
                          onClick={() => setSelectedField(null)}
                          className="p-1 text-purple-400 hover:text-cyan-300 transition-colors"
                          title="Close Properties Panel"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Label */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label
                            {(() => {
                              const fieldTypeLabels = {
                                'text': 'Text Input', 'email': 'Email Address', 'number': 'Number',
                                'tel': 'Phone Number', 'url': 'Website URL', 'password': 'Password',
                                'textarea': 'Message', 'select': 'Dropdown Selection', 'radio': 'Radio Buttons',
                                'checkbox': 'Checkboxes', 'date': 'Date', 'time': 'Time',
                                'datetime-local': 'Date & Time', 'file': 'File Upload', 'range': 'Range Slider',
                                'color': 'Color Picker'
                              };
                              const defaultLabels = Object.values(fieldTypeLabels);
                              const currentLabel = fields[selectedField]?.label || '';
                              const isDefaultLabel = !currentLabel || defaultLabels.includes(currentLabel) || 
                                currentLabel.match(/^(Field \d+|Text Input|Email Address|Number|Phone Number|Website URL|Password|Message|Dropdown Selection|Radio Buttons|Checkboxes|Date|Time|Date & Time|File Upload|Range Slider|Color Picker)$/);
                              
                              return isDefaultLabel ? (
                                <span className="text-xs text-blue-600 ml-1">(auto-updates with field type)</span>
                              ) : null;
                            })()}
                          </label>
                          <input
                            type="text"
                            value={fields[selectedField]?.label || ''}
                            onChange={(e) => updateFieldProperty(selectedField, 'label', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                          />
                        </div>

                        {/* Field Type */}
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">Field Type</label>
                          <select
                            value={fields[selectedField]?.field_type || 'text'}
                            onChange={(e) => updateFieldProperty(selectedField, 'field_type', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="number">Number</option>
                            <option value="tel">Phone</option>
                            <option value="url">URL</option>
                            <option value="password">Password</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Dropdown</option>
                            <option value="radio">Radio Buttons</option>
                            <option value="checkbox">Checkboxes</option>
                            <option value="date">Date</option>
                            <option value="time">Time</option>
                            <option value="datetime-local">Date & Time</option>
                            <option value="file">File Upload</option>
                            <option value="range">Range Slider</option>
                            <option value="color">Color Picker</option>
                          </select>
                        </div>

                        {/* Placeholder */}
                        {['text', 'email', 'number', 'tel', 'url', 'password', 'textarea'].includes(fields[selectedField]?.field_type) && (
                          <div>
                            <label className="block text-sm font-medium text-purple-300 mb-1">Placeholder</label>
                            <input
                              type="text"
                              value={fields[selectedField]?.placeholder || ''}
                              onChange={(e) => updateFieldProperty(selectedField, 'placeholder', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                            />
                          </div>
                        )}

                        {/* Min/Max for number and range fields */}
                        {['number', 'range'].includes(fields[selectedField]?.field_type) && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-purple-300 mb-1">Min Value</label>
                              <input
                                type="number"
                                value={fields[selectedField]?.min || ''}
                                onChange={(e) => updateFieldProperty(selectedField, 'min', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-purple-300 mb-1">Max Value</label>
                              <input
                                type="number"
                                value={fields[selectedField]?.max || ''}
                                onChange={(e) => updateFieldProperty(selectedField, 'max', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                              />
                            </div>
                          </div>
                        )}

                        {/* Step for number and range fields */}
                        {['number', 'range'].includes(fields[selectedField]?.field_type) && (
                          <div>
                            <label className="block text-sm font-medium text-purple-300 mb-1">Step</label>
                            <input
                              type="number"
                              value={fields[selectedField]?.step || ''}
                              onChange={(e) => updateFieldProperty(selectedField, 'step', e.target.value)}
                              placeholder="1"
                              className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                            />
                          </div>
                        )}

                        {/* Help Text */}
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">Help Text</label>
                          <textarea
                            value={fields[selectedField]?.helpText || ''}
                            onChange={(e) => updateFieldProperty(selectedField, 'helpText', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                          />
                        </div>

                        {/* Required */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="required"
                            checked={fields[selectedField]?.is_required || false}
                            onChange={(e) => updateFieldProperty(selectedField, 'is_required', e.target.checked)}
                            className="h-4 w-4 text-cyan-400 bg-gray-700 border-purple-600 focus:ring-cyan-400 rounded"
                          />
                          <label htmlFor="required" className="ml-2 block text-sm text-purple-300">
                            Required field
                          </label>
                        </div>

                        {/* Read-only */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="readonly"
                            checked={fields[selectedField]?.is_readonly || false}
                            onChange={(e) => updateFieldProperty(selectedField, 'is_readonly', e.target.checked)}
                            className="h-4 w-4 text-cyan-400 bg-gray-700 border-purple-600 focus:ring-cyan-400 rounded"
                          />
                          <label htmlFor="readonly" className="ml-2 block text-sm text-purple-300">
                            Read-only field
                          </label>
                        </div>

                        {/* Options for select, radio, checkbox */}
                        {['select', 'radio', 'checkbox'].includes(fields[selectedField]?.field_type) && (
                          <div>
                            <label className="block text-sm font-medium text-purple-300 mb-2">Options</label>
                            <div className="space-y-2">
                              {(() => {
                                const fieldOptions = fields[selectedField]?.options;
                                const options = Array.isArray(fieldOptions) ? fieldOptions : 
                                  (fieldOptions ? JSON.parse(fieldOptions || '[]') : []);
                                return options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => updateFieldOption(selectedField, optIndex, e.target.value)}
                                      placeholder={`Option ${optIndex + 1}`}
                                      className="flex-1 px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-purple-600/30 text-white placeholder-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                                    />
                                    <button
                                      onClick={() => removeFieldOption(selectedField, optIndex)}
                                      className="p-2 text-red-500 hover:text-red-700"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                ));
                              })()}
                              <button
                                onClick={() => addFieldOption(selectedField)}
                                className="w-full py-2 px-3 border border-dashed border-purple-600/50 bg-gray-800/30 rounded-md text-sm text-purple-300 hover:bg-gray-700/50 hover:border-purple-500/60 transition-all duration-300"
                              >
                                + Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="h-full flex flex-col">
                  <DevicePreview
                    form={{ 
                      name, 
                      description,
                      type: type === 'other' ? customType : type
                    }}
                    fields={fields}
                    values={previewValues}
                    onValueChange={handlePreviewValueChange}
                    autoFillMode={true}
                  />
                </div>
              )}

              {activeTab === 'logic' && (
                <div className="h-full overflow-y-auto p-6 bg-gray-900/50 backdrop-blur-sm">
                  <ConditionalLogic
                    fields={fields}
                    onUpdateConditions={setConditionalLogic}
                    initialConditions={conditionalLogic}
                  />
                </div>
              )}

              {activeTab === 'analytics' && formId && (
                <div className="h-full overflow-y-auto bg-gray-900/50 backdrop-blur-sm">
                  <FormAnalytics formId={formId} />
                </div>
              )}

              {activeTab === 'analytics' && !formId && (
                <div className="h-full overflow-y-auto p-6 bg-gray-900/50 backdrop-blur-sm">
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-purple-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg font-medium text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Save your form first</p>
                    <p className="text-sm text-purple-300">Analytics are available after you save the form</p>
                  </div>
                </div>
              )}

              {activeTab === 'share' && formId && (
                <div className="h-full overflow-y-auto p-6 bg-gray-900/50 backdrop-blur-sm">
                  <FormShare form={{ name, description }} formId={formId} />
                </div>
              )}

              {activeTab === 'share' && !formId && (
                <div className="h-full overflow-y-auto p-6 bg-gray-900/50 backdrop-blur-sm">
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-cyan-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <p className="text-lg font-medium text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Save your form first</p>
                    <p className="text-sm text-purple-300">You need to save the form before you can share it</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Field Properties Panel */}
      {selectedField !== null && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setSelectedField(null)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-md border border-purple-700/30 rounded-t-lg shadow-2xl shadow-purple-900/40 max-h-[85vh] overflow-hidden mobile-field-properties-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull indicator */}
            <div className="mobile-pull-indicator w-full h-6 bg-gray-700/80 rounded-t-lg"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-800/30 bg-gray-800/90">
              <div>
                <h3 className="text-lg font-semibold text-purple-200">Field Properties</h3>
                <p className="text-sm text-purple-300/80">Configure "{fields[selectedField]?.label || 'Field'}"</p>
              </div>
              <button
                onClick={() => setSelectedField(null)}
                className="p-2 text-purple-300/60 hover:text-purple-300 transition-colors touch-friendly"
                title="Close Properties Panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
              <div className="space-y-4">
                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-1">
                    Label
                    {(() => {
                      const fieldTypeLabels = {
                        'text': 'Text Input', 'email': 'Email Address', 'number': 'Number',
                        'tel': 'Phone Number', 'url': 'Website URL', 'password': 'Password',
                        'textarea': 'Message', 'select': 'Dropdown Selection', 'radio': 'Radio Buttons',
                        'checkbox': 'Checkboxes', 'date': 'Date', 'time': 'Time',
                        'datetime-local': 'Date & Time', 'file': 'File Upload', 'range': 'Range Slider',
                        'color': 'Color Picker'
                      };
                      const defaultLabels = Object.values(fieldTypeLabels);
                      const currentLabel = fields[selectedField]?.label || '';
                      const isDefaultLabel = !currentLabel || defaultLabels.includes(currentLabel) || 
                        currentLabel.match(/^(Field \d+|Text Input|Email Address|Number|Phone Number|Website URL|Password|Message|Dropdown Selection|Radio Buttons|Checkboxes|Date|Time|Date & Time|File Upload|Range Slider|Color Picker)$/);
                      
                      return isDefaultLabel ? (
                        <span className="text-xs text-cyan-400 ml-1">(auto-updates with field type)</span>
                      ) : null;
                    })()}
                  </label>
                  <input
                    type="text"
                    value={fields[selectedField]?.label || ''}
                    onChange={(e) => updateFieldProperty(selectedField, 'label', e.target.value)}
                    className="w-full px-3 py-3 border border-purple-800/30 bg-gray-700/50 text-purple-100 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 mobile-compact-input"
                  />
                </div>

                {/* Field Type */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-1">Field Type</label>
                  <select
                    value={fields[selectedField]?.field_type || 'text'}
                    onChange={(e) => updateFieldProperty(selectedField, 'field_type', e.target.value)}
                    className="w-full px-3 py-3 border border-purple-800/30 bg-gray-700/50 text-purple-100 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 mobile-compact-input"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="tel">Phone</option>
                    <option value="url">URL</option>
                    <option value="password">Password</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Dropdown</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkboxes</option>
                    <option value="date">Date</option>
                    <option value="time">Time</option>
                    <option value="datetime-local">Date & Time</option>
                    <option value="file">File Upload</option>
                    <option value="range">Range Slider</option>
                    <option value="color">Color Picker</option>
                  </select>
                </div>

                {/* Placeholder */}
                {['text', 'email', 'number', 'tel', 'url', 'password', 'textarea'].includes(fields[selectedField]?.field_type) && (
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={fields[selectedField]?.placeholder || ''}
                      onChange={(e) => updateFieldProperty(selectedField, 'placeholder', e.target.value)}
                      className="w-full px-3 py-3 border border-purple-800/30 bg-gray-700/50 text-purple-100 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 mobile-compact-input"
                    />
                  </div>
                )}

                {/* Min/Max for number and range fields */}
                {['number', 'range'].includes(fields[selectedField]?.field_type) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-1">Min Value</label>
                      <input
                        type="number"
                        value={fields[selectedField]?.min || ''}
                        onChange={(e) => updateFieldProperty(selectedField, 'min', e.target.value)}
                        className="w-full px-3 py-3 border border-purple-800/30 bg-gray-700/50 text-purple-100 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 mobile-compact-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-1">Max Value</label>
                      <input
                        type="number"
                        value={fields[selectedField]?.max || ''}
                        onChange={(e) => updateFieldProperty(selectedField, 'max', e.target.value)}
                        className="w-full px-3 py-3 border border-purple-800/30 bg-gray-700/50 text-purple-100 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 mobile-compact-input"
                      />
                    </div>
                  </div>
                )}

                {/* Step for number and range fields */}
                {['number', 'range'].includes(fields[selectedField]?.field_type) && (
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-1">Step</label>
                    <input
                      type="number"
                      value={fields[selectedField]?.step || ''}
                      onChange={(e) => updateFieldProperty(selectedField, 'step', e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-3 border border-purple-800/30 bg-gray-700/50 text-purple-100 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 mobile-compact-input"
                    />
                  </div>
                )}

                {/* Help Text */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-1">Help Text</label>
                  <textarea
                    value={fields[selectedField]?.helpText || ''}
                    onChange={(e) => updateFieldProperty(selectedField, 'helpText', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-3 border border-purple-800/30 bg-gray-700/50 text-purple-100 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 mobile-compact-input"
                  />
                </div>

                {/* Required */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required-mobile"
                    checked={fields[selectedField]?.is_required || false}
                    onChange={(e) => updateFieldProperty(selectedField, 'is_required', e.target.checked)}
                    className="h-4 w-4 text-cyan-400 focus:ring-cyan-500 border-purple-800/30 rounded"
                  />
                  <label htmlFor="required-mobile" className="ml-2 block text-sm text-purple-200">
                    Required field
                  </label>
                </div>

                {/* Read-only */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="readonly-mobile"
                    checked={fields[selectedField]?.is_readonly || false}
                    onChange={(e) => updateFieldProperty(selectedField, 'is_readonly', e.target.checked)}
                    className="h-4 w-4 text-cyan-400 focus:ring-cyan-500 border-purple-800/30 rounded"
                  />
                  <label htmlFor="readonly-mobile" className="ml-2 block text-sm text-purple-200">
                    Read-only field
                  </label>
                </div>

                {/* Options for select, radio, checkbox */}
                {['select', 'radio', 'checkbox'].includes(fields[selectedField]?.field_type) && (
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Options</label>
                    <div className="space-y-2">
                      {(() => {
                        const fieldOptions = fields[selectedField]?.options;
                        const options = Array.isArray(fieldOptions) ? fieldOptions : 
                          (fieldOptions ? JSON.parse(fieldOptions || '[]') : []);
                        return options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateFieldOption(selectedField, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 px-3 py-3 border border-purple-800/30 bg-gray-700/50 text-purple-100 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 mobile-compact-input"
                            />
                            <button
                              onClick={() => removeFieldOption(selectedField, optIndex)}
                              className="p-2 text-red-400 hover:text-red-300 touch-friendly"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ));
                      })()}
                      <button
                        onClick={() => addFieldOption(selectedField)}
                        className="w-full py-3 px-3 border border-dashed border-purple-800/30 rounded-md text-sm text-purple-300/80 hover:bg-purple-900/20 transition-colors touch-friendly"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fields Management Panel */}
      {isMobileFieldsOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setIsMobileFieldsOpen(false)}
          >
            <div 
              className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-gray-800/95 backdrop-blur-md shadow-lg shadow-purple-900/40 transform transition-transform duration-300 ease-in-out"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-purple-800/30 bg-gray-800/90">
                <h2 className="text-lg font-semibold text-purple-200">Form Fields</h2>
                <button
                  onClick={() => setIsMobileFieldsOpen(false)}
                  className="p-2 text-purple-300/60 hover:text-purple-300 rounded-lg touch-friendly"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-gray-900/50 p-4">
                <div className="space-y-4">
                  {/* Quick Add Section */}
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-purple-800/30">
                    <h3 className="text-sm font-semibold text-purple-200 mb-3 flex items-center space-x-2">
                      <span>🧩</span>
                      <span>Quick Add</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          addField({ field_type: 'text', label: 'Text Input' });
                          setIsMobileFieldsOpen(false);
                        }}
                        className="p-2 text-xs bg-blue-900/60 text-blue-300 rounded-md hover:bg-blue-900/80 transition-colors touch-friendly"
                      >
                        Text
                      </button>
                      <button
                        onClick={() => {
                          addField({ field_type: 'email', label: 'Email Address' });
                          setIsMobileFieldsOpen(false);
                        }}
                        className="p-2 text-xs bg-green-900/60 text-green-300 rounded-md hover:bg-green-900/80 transition-colors touch-friendly"
                      >
                        Email
                      </button>
                      <button
                        onClick={() => {
                          addField({ field_type: 'select', label: 'Dropdown Selection', options: ['Option 1', 'Option 2', 'Option 3'] });
                          setIsMobileFieldsOpen(false);
                        }}
                        className="p-2 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors touch-friendly"
                      >
                        Dropdown
                      </button>
                      <button
                        onClick={() => {
                          addField({ field_type: 'textarea', label: 'Message' });
                          setIsMobileFieldsOpen(false);
                        }}
                        className="p-2 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors touch-friendly"
                      >
                        Message
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileFieldsOpen(false);
                        setMobileActiveSection('fields');
                        setIsMobileSidebarOpen(true);
                      }}
                      className="w-full mt-3 p-2 text-xs bg-purple-900/60 text-purple-300 rounded-md hover:bg-purple-900/80 transition-colors touch-friendly"
                    >
                      View All Field Types
                    </button>
                  </div>

                  {/* Fields List */}
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-purple-800/30">
                    <h3 className="text-sm font-semibold text-purple-200 mb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>📝</span>
                        <span>Current Fields ({fields.length})</span>
                      </div>
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {fields.length > 0 ? (
                        fields.map((field, index) => (
                          <div
                            key={field.id || index}
                            className={`p-3 border border-purple-800/30 rounded-md transition-colors ${
                              selectedField === index ? 'border-cyan-500 bg-cyan-900/30' : 'hover:border-purple-600/50 bg-gray-800/30'
                            }`}
                            onClick={() => setSelectedField(selectedField === index ? null : index)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-purple-200 truncate">
                                  {field.label || `Field ${index + 1}`}
                                </h4>
                                <p className="text-xs text-purple-400/70 uppercase">{field.field_type}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateField(index);
                                  }}
                                  className="p-1 text-purple-400/60 hover:text-cyan-400 touch-friendly"
                                  title="Duplicate"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeField(index);
                                  }}
                                  className="p-1 text-purple-400/60 hover:text-red-400 touch-friendly"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {(field.is_required || field.is_readonly) && (
                              <div className="flex space-x-1 mt-1">
                                {field.is_required && <span className="inline-block bg-red-900/60 text-red-300 px-1 py-0.5 text-xs rounded">Required</span>}
                                {field.is_readonly && <span className="inline-block bg-purple-900/60 text-purple-300 px-1 py-0.5 text-xs rounded">Read-only</span>}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-purple-400/70">
                          <svg className="mx-auto h-8 w-8 text-purple-400/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className="text-sm">No fields added yet</p>
                          <p className="text-xs">Use the quick add buttons above</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Sidebar Modal */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={`mobile-sidebar lg:hidden ${isMobileSidebarOpen ? 'open' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMobileSidebarOpen(false);
            }}
          >
            <div className="mobile-sidebar-content w-full">
              {/* Drag Handle */}
              <div 
                className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
              </div>

              {/* Mobile Sidebar Header */}
              <div className="px-4 py-2 border-b border-purple-800/30 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  {mobileActiveSection === 'settings' && 'Form Settings'}
                  {mobileActiveSection === 'ai' && 'AI Assistant'}
                  {mobileActiveSection === 'fields' && 'Add Fields'}
                </h3>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Sidebar Tabs */}
              <div className="flex border-b border-purple-800/30 bg-gray-900/50">
                <button
                  onClick={() => setMobileActiveSection('settings')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    mobileActiveSection === 'settings'
                      ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-900/10'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Settings
                </button>
                <button
                  onClick={() => setMobileActiveSection('ai')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    mobileActiveSection === 'ai'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/10'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  AI Assistant
                </button>
                <button
                  onClick={() => setMobileActiveSection('fields')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    mobileActiveSection === 'fields'
                      ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-900/10'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Add Fields
                </button>
              </div>

              {/* Mobile Sidebar Content */}
              <div className="flex-1 overflow-y-auto bg-gray-900/95 backdrop-blur-md p-4 pb-8 mobile-tab-content">
                <div className="space-y-4">
                  {/* Settings Section */}
                  {mobileActiveSection === 'settings' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">Form Name *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter form name"
                          className="w-full px-3 py-3 text-base bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 mobile-compact-input transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Enter form description"
                          rows={3}
                          className="w-full px-3 py-3 text-base bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 resize-none mobile-compact-input transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">Form Type</label>
                        <select
                          value={type}
                          onChange={(e) => {
                            setType(e.target.value);
                            if (e.target.value !== 'other') setCustomType('');
                          }}
                          className="w-full px-3 py-3 text-base bg-gray-900/70 border border-purple-600/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 mobile-compact-input transition-all duration-300"
                        >
                          <option value="">Select type</option>
                          <option value="contact">Contact Form</option>
                          <option value="survey">Survey</option>
                          <option value="registration">Registration</option>
                          <option value="feedback">Feedback</option>
                          <option value="application">Application</option>
                          <option value="other">Other</option>
                        </select>
                        {type === 'other' && (
                          <input
                            type="text"
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            placeholder="Enter custom form type"
                            className="w-full px-3 py-3 text-base bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 mt-3 mobile-compact-input transition-all duration-300"
                          />
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setShowTemplates(true);
                            setIsMobileSidebarOpen(false);
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 px-4 rounded-md font-medium hover:from-purple-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 touch-friendly flex items-center justify-center space-x-2 border border-purple-500/30"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>Use Template</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* AI Section */}
                  {mobileActiveSection === 'ai' && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-cyan-900/50 backdrop-blur-sm rounded-lg p-4 border border-purple-700/30 shadow-lg shadow-purple-900/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 animate-pulse rounded-lg"></div>
                        <div className="relative z-10">
                          <h3 className="text-base font-semibold text-white mb-3 flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                              <svg className="w-3 h-3 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                                <path d="M12 3l1.5 7.5L21 12l-7.5 1.5L12 21l-1.5-7.5L3 12l7.5-1.5L12 3z"/>
                                <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                              </svg>
                            </div>
                            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">AI Assistant</span>
                          </h3>
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your form and I'll generate fields for you..."
                            rows={4}
                            className="w-full px-3 py-3 text-base bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 resize-none mb-3 mobile-compact-input transition-all duration-300"
                          />
                          <button
                            onClick={() => {
                              handleAIGenerate();
                              setIsMobileSidebarOpen(false);
                            }}
                            disabled={loadingAI || !prompt.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white py-3 px-4 rounded-md font-medium hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-friendly transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 border border-purple-500/30"
                          >
                            {loadingAI ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                                <path d="M12 3l1.5 7.5L21 12l-7.5 1.5L12 21l-1.5-7.5L3 12l7.5-1.5L12 3z"/>
                                <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                              </svg>
                            )}
                            <span>{loadingAI ? 'Generating...' : 'Generate Fields'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Fields Section */}
                  {mobileActiveSection === 'fields' && (
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-white flex items-center space-x-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        <span>🧩</span>
                        <span>Add Field</span>
                      </h3>
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-purple-700/30 shadow-lg shadow-purple-900/20">
                        <WidgetLibrary 
                          onAddField={(field) => {
                            addField(field);
                            setIsMobileSidebarOpen(false);
                          }} 
                          className="border-0 p-0"
                          isMobile={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Form Templates Modal */}
      {showTemplates && (
        <FormTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Resizable Form Preview Modal */}
      {isModalOpen && (
        <div className={`form-preview-modal ${isModalOpen ? 'open' : ''} bg-gray-900/95 backdrop-blur-md`}>
          <div className="form-preview-modal-content bg-gray-800/90 backdrop-blur-md border border-purple-700/30 shadow-2xl shadow-purple-900/50">
            <div className="form-preview-modal-header bg-gray-900/90 backdrop-blur-md border-b border-purple-800/30">
              <h2 className="form-preview-modal-title text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                {name || 'Form Preview'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="form-preview-modal-close text-purple-300 hover:text-cyan-300 hover:bg-purple-800/30 rounded-lg p-2 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="form-preview-modal-body bg-gray-900/90">
              <div className="flex h-full">
                {/* Form Preview Area - Scrollable */}
                <div className="flex-1 pr-4 overflow-y-auto">
                  {renderFormPreview(true)}
                </div>
                
                {/* Properties Panel - Fixed */}
                {selectedField !== null && (
                  <div className="w-80 bg-gray-800/50 backdrop-blur-sm border-l border-purple-800/30 pl-4 flex flex-col shadow-lg shadow-purple-900/20">
                    <div className="mb-4 flex items-center justify-between flex-shrink-0">
                      <div>
                        <h3 className="text-lg font-semibold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">Field Properties</h3>
                        <p className="text-sm text-purple-300">Configure the selected field</p>
                      </div>
                      <button
                        onClick={() => setSelectedField(null)}
                        className="p-1 text-purple-400 hover:text-cyan-300 hover:bg-purple-800/30 rounded-lg transition-all duration-300"
                        title="Close Properties Panel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                      {/* Field Label */}
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-1">
                          Field Label
                        </label>
                        <input
                          type="text"
                          value={fields[selectedField]?.label || ''}
                          onChange={(e) => updateFieldProperty(selectedField, 'label', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                          placeholder="Enter field label"
                        />
                      </div>

                      {/* Field Type */}
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-1">
                          Field Type
                        </label>
                        <select
                          value={fields[selectedField]?.field_type || 'text'}
                          onChange={(e) => updateFieldProperty(selectedField, 'field_type', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                        >
                          <option value="text">Text Input</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="tel">Phone</option>
                          <option value="url">URL</option>
                          <option value="password">Password</option>
                          <option value="textarea">Textarea</option>
                          <option value="select">Dropdown</option>
                          <option value="radio">Radio Buttons</option>
                          <option value="checkbox">Checkboxes</option>
                          <option value="date">Date</option>
                          <option value="time">Time</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>

                      {/* Placeholder */}
                      {['text', 'email', 'number', 'tel', 'url', 'password', 'textarea'].includes(fields[selectedField]?.field_type) && (
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">
                            Placeholder
                          </label>
                          <input
                            type="text"
                            value={fields[selectedField]?.placeholder || ''}
                            onChange={(e) => updateFieldProperty(selectedField, 'placeholder', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                            placeholder="Enter placeholder text"
                          />
                        </div>
                      )}

                      {/* Help Text */}
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-1">
                          Help Text
                        </label>
                        <input
                          type="text"
                          value={fields[selectedField]?.helpText || ''}
                          onChange={(e) => updateFieldProperty(selectedField, 'helpText', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                          placeholder="Enter help text"
                        />
                      </div>

                      {/* Required Field */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fields[selectedField]?.is_required || false}
                          onChange={(e) => updateFieldProperty(selectedField, 'is_required', e.target.checked)}
                          className="mr-2 bg-gray-900/70 border border-purple-600/50 text-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded"
                        />
                        <label className="text-sm text-purple-300">Required field</label>
                      </div>

                      {/* Options for select, radio, checkbox */}
                      {['select', 'radio', 'checkbox'].includes(fields[selectedField]?.field_type) && (
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">
                            Options (one per line)
                          </label>
                          <textarea
                            value={(() => {
                              const options = fields[selectedField]?.options;
                              if (Array.isArray(options)) {
                                return options.join('\n');
                              }
                              if (typeof options === 'string') {
                                try {
                                  return JSON.parse(options).join('\n');
                                } catch {
                                  return options;
                                }
                              }
                              return '';
                            })()}
                            onChange={(e) => {
                              const options = e.target.value.split('\n').filter(option => option.trim());
                              updateFieldProperty(selectedField, 'options', options);
                            }}
                            rows={4}
                            className="w-full px-3 py-2 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Details Input Modal */}
      {showNameInputModal && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gray-800/90 backdrop-blur-sm border border-purple-700/30 rounded-lg p-6 w-11/12 max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-900/50">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">Complete Form Details</h3>
              <p className="text-sm text-purple-300">Please fill in the required details to save your form.</p>
            </div>
            
            <div className="space-y-4 mb-6">
              {/* Form Name */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Form Name *
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 text-base transition-all duration-300"
                  placeholder="Enter form name..."
                  autoFocus
                />
              </div>

              {/* Form Description */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Description
                </label>
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-3 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 text-base resize-none transition-all duration-300"
                  placeholder="Describe your form (optional)..."
                />
              </div>

              {/* Form Type */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Form Type *
                </label>
                <select
                  value={tempType}
                  onChange={(e) => setTempType(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-900/70 border border-purple-600/50 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 text-base transition-all duration-300"
                >
                  <option value="">Select form type...</option>
                  <option value="contact">Contact Form</option>
                  <option value="survey">Survey</option>
                  <option value="feedback">Feedback</option>
                  <option value="registration">Registration</option>
                  <option value="application">Application</option>
                  <option value="order">Order Form</option>
                  <option value="booking">Booking</option>
                  <option value="newsletter">Newsletter Signup</option>
                  <option value="support">Support Request</option>
                  <option value="quiz">Quiz</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Custom Type (when Other is selected) */}
              {tempType === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Custom Form Type *
                  </label>
                  <input
                    type="text"
                    value={tempCustomType}
                    onChange={(e) => setTempCustomType(e.target.value)}
                    className="w-full px-3 py-3 bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 text-base transition-all duration-300"
                    placeholder="Enter custom form type..."
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNameInputModal(false);
                  setTempName('');
                  setTempDescription('');
                  setTempType('');
                  setTempCustomType('');
                }}
                className="flex-1 px-4 py-3 text-purple-300 bg-gray-800/50 hover:bg-gray-700/60 rounded-lg transition-all duration-300 text-base font-medium border border-purple-600/30 hover:border-purple-500/50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWithName}
                disabled={!tempName.trim() || !tempType.trim() || (tempType === 'other' && !tempCustomType.trim()) || loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-base font-medium transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 border border-green-500/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tempName.trim() && tempType.trim() && (tempType !== 'other' || tempCustomType.trim())) {
                    handleSaveWithName();
                  } else if (e.key === 'Escape') {
                    setShowNameInputModal(false);
                    setTempName('');
                    setTempDescription('');
                    setTempType('');
                    setTempCustomType('');
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Form'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Manager Modal */}
      <FieldManagerModal />
    </div>
  );
}
