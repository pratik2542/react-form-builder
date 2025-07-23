import { useState } from 'react';
import { getSuggestedFields } from '../utils/groq';

const FORM_TEMPLATES = [
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'Basic contact form with name, email, and message',
    category: 'General',
    icon: '📞',
    fields: [
      { field_type: 'text', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
      { field_type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
      { field_type: 'text', label: 'Phone Number', required: false, placeholder: 'Enter your phone number' },
      { field_type: 'select', label: 'Subject', required: true, options: ['General Inquiry', 'Support', 'Sales', 'Other'] },
      { field_type: 'textarea', label: 'Message', required: true, placeholder: 'Enter your message here...' }
    ]
  },
  {
    id: 'survey',
    name: 'Customer Survey',
    description: 'Feedback survey with rating and multiple choice questions',
    category: 'Survey',
    icon: '📊',
    fields: [
      { field_type: 'text', label: 'Customer Name', required: true },
      { field_type: 'email', label: 'Email Address', required: true },
      { field_type: 'radio', label: 'Overall Satisfaction', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
      { field_type: 'checkbox', label: 'Which features do you use?', required: false, options: ['Feature A', 'Feature B', 'Feature C', 'Feature D'] },
      { field_type: 'select', label: 'How did you hear about us?', required: false, options: ['Google', 'Social Media', 'Friend Referral', 'Advertisement', 'Other'] },
      { field_type: 'textarea', label: 'Additional Comments', required: false, placeholder: 'Any additional feedback...' }
    ]
  },
  {
    id: 'registration',
    name: 'Event Registration',
    description: 'Registration form for events and workshops',
    category: 'Registration',
    icon: '🎫',
    fields: [
      { field_type: 'text', label: 'First Name', required: true },
      { field_type: 'text', label: 'Last Name', required: true },
      { field_type: 'email', label: 'Email Address', required: true },
      { field_type: 'text', label: 'Phone Number', required: true },
      { field_type: 'text', label: 'Company/Organization', required: false },
      { field_type: 'select', label: 'Ticket Type', required: true, options: ['Early Bird', 'Regular', 'Student', 'VIP'] },
      { field_type: 'radio', label: 'Meal Preference', required: true, options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'] },
      { field_type: 'checkbox', label: 'Additional Services', required: false, options: ['Workshop Materials', 'Lunch', 'Certificate', 'Networking Session'] },
      { field_type: 'textarea', label: 'Special Requirements', required: false, placeholder: 'Any special needs or requirements...' }
    ]
  },
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Comprehensive job application form',
    category: 'HR',
    icon: '💼',
    fields: [
      { field_type: 'text', label: 'Full Name', required: true },
      { field_type: 'email', label: 'Email Address', required: true },
      { field_type: 'text', label: 'Phone Number', required: true },
      { field_type: 'text', label: 'Address', required: true },
      { field_type: 'select', label: 'Position Applied For', required: true, options: ['Software Developer', 'Product Manager', 'Designer', 'Marketing Specialist', 'Other'] },
      { field_type: 'select', label: 'Experience Level', required: true, options: ['Entry Level (0-2 years)', 'Mid Level (3-5 years)', 'Senior Level (6-10 years)', 'Lead/Manager (10+ years)'] },
      { field_type: 'file', label: 'Resume/CV', required: true },
      { field_type: 'file', label: 'Cover Letter', required: false },
      { field_type: 'text', label: 'LinkedIn Profile', required: false, placeholder: 'https://linkedin.com/in/...' },
      { field_type: 'number', label: 'Expected Salary (USD)', required: false, placeholder: 'Enter expected salary' },
      { field_type: 'date', label: 'Available Start Date', required: true },
      { field_type: 'textarea', label: 'Why do you want to join us?', required: true, placeholder: 'Tell us about your motivation...' }
    ]
  },
  {
    id: 'feedback',
    name: 'Product Feedback',
    description: 'Collect feedback about products or services',
    category: 'Feedback',
    icon: '💭',
    fields: [
      { field_type: 'text', label: 'Product Name', required: true },
      { field_type: 'email', label: 'Your Email', required: true },
      { field_type: 'radio', label: 'Overall Rating', required: true, options: ['⭐ Poor', '⭐⭐ Fair', '⭐⭐⭐ Good', '⭐⭐⭐⭐ Very Good', '⭐⭐⭐⭐⭐ Excellent'] },
      { field_type: 'checkbox', label: 'What did you like?', required: false, options: ['Design', 'Functionality', 'Performance', 'Price', 'Customer Support'] },
      { field_type: 'checkbox', label: 'What needs improvement?', required: false, options: ['Design', 'Functionality', 'Performance', 'Price', 'Customer Support', 'Documentation'] },
      { field_type: 'radio', label: 'Would you recommend this product?', required: true, options: ['Definitely Yes', 'Probably Yes', 'Not Sure', 'Probably No', 'Definitely No'] },
      { field_type: 'textarea', label: 'Additional Comments', required: false, placeholder: 'Share your detailed feedback...' }
    ]
  },
  {
    id: 'order',
    name: 'Order Form',
    description: 'Simple order form for products or services',
    category: 'E-commerce',
    icon: '🛒',
    fields: [
      { field_type: 'text', label: 'Customer Name', required: true },
      { field_type: 'email', label: 'Email Address', required: true },
      { field_type: 'text', label: 'Phone Number', required: true },
      { field_type: 'textarea', label: 'Billing Address', required: true, placeholder: 'Enter your complete billing address' },
      { field_type: 'checkbox', label: 'Shipping address same as billing?', required: false, options: ['Yes, use same address'] },
      { field_type: 'textarea', label: 'Shipping Address', required: false, placeholder: 'Enter shipping address if different' },
      { field_type: 'select', label: 'Product Category', required: true, options: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'] },
      { field_type: 'text', label: 'Product Name', required: true },
      { field_type: 'number', label: 'Quantity', required: true, placeholder: '1' },
      { field_type: 'select', label: 'Payment Method', required: true, options: ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery'] },
      { field_type: 'textarea', label: 'Special Instructions', required: false, placeholder: 'Any special delivery instructions...' }
    ]
  },
  {
    id: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Simple newsletter subscription form',
    category: 'Marketing',
    icon: '📧',
    fields: [
      { field_type: 'text', label: 'First Name', required: true },
      { field_type: 'text', label: 'Last Name', required: true },
      { field_type: 'email', label: 'Email Address', required: true },
      { field_type: 'checkbox', label: 'Interests', required: false, options: ['Technology', 'Business', 'Marketing', 'Design', 'Lifestyle'] },
      { field_type: 'select', label: 'Email Frequency', required: true, options: ['Daily', 'Weekly', 'Monthly', 'Quarterly'] },
      { field_type: 'checkbox', label: 'Agreements', required: true, options: ['I agree to receive marketing emails', 'I agree to the terms and conditions'] }
    ]
  },
  {
    id: 'booking',
    name: 'Appointment Booking',
    description: 'Book appointments or meetings',
    category: 'Booking',
    icon: '📅',
    fields: [
      { field_type: 'text', label: 'Full Name', required: true },
      { field_type: 'email', label: 'Email Address', required: true },
      { field_type: 'text', label: 'Phone Number', required: true },
      { field_type: 'select', label: 'Service Type', required: true, options: ['Consultation', 'Follow-up', 'New Patient', 'Emergency'] },
      { field_type: 'date', label: 'Preferred Date', required: true },
      { field_type: 'select', label: 'Preferred Time', required: true, options: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'] },
      { field_type: 'textarea', label: 'Reason for Visit', required: true, placeholder: 'Briefly describe the reason for your visit...' },
      { field_type: 'radio', label: 'Have you visited before?', required: true, options: ['Yes, returning patient', 'No, new patient'] },
      { field_type: 'textarea', label: 'Additional Notes', required: false, placeholder: 'Any additional information...' }
    ]
  }
];

const CATEGORIES = ['All', 'General', 'Survey', 'Registration', 'HR', 'Feedback', 'E-commerce', 'Marketing', 'Booking'];

export default function FormTemplates({ onSelectTemplate, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [enhancingTemplate, setEnhancingTemplate] = useState(null);
  const [enhancePrompt, setEnhancePrompt] = useState('');

  const filteredTemplates = FORM_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleStartFromScratch = () => {
    // Create an empty template to clear the form
    const emptyTemplate = {
      name: '',
      description: '',
      category: '',
      fields: []
    };
    onSelectTemplate(emptyTemplate);
    onClose();
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setLoadingAI(true);
    try {
      const aiSuggestions = await getSuggestedFields(aiPrompt);
      
      if (Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
        const aiGeneratedFields = aiSuggestions.map((suggestion, i) => {
          // Convert options from {label, value} format to simple strings if needed
          let options = [];
          if (suggestion.options) {
            if (Array.isArray(suggestion.options)) {
              options = suggestion.options.map(option => {
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
            } else if (typeof suggestion.options === 'string') {
              try {
                const parsed = JSON.parse(suggestion.options);
                options = Array.isArray(parsed) ? parsed.map(opt => 
                  typeof opt === 'string' ? opt : (opt.label || opt.value || String(opt))
                ) : [suggestion.options];
              } catch {
                options = [suggestion.options];
              }
            }
          }

          return {
            field_type: suggestion.field_type || suggestion.type || 'text',
            label: suggestion.label || `Field ${i + 1}`,
            required: suggestion.required || false,
            placeholder: suggestion.placeholder || '',
            options: options
          };
        });

        const aiTemplate = {
          name: `AI Generated Form`,
          description: `Form generated from: "${aiPrompt}"`,
          category: 'AI Generated',
          fields: aiGeneratedFields
        };

        onSelectTemplate(aiTemplate);
        onClose();
      } else {
        alert('AI failed to generate fields. Please try again with a different description.');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      alert('AI failed to generate fields. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEnhanceTemplate = async (template) => {
    if (!enhancePrompt.trim()) return;
    
    setLoadingAI(true);
    try {
      const enhanceRequest = `Enhance this existing form template with additional fields based on the request: "${enhancePrompt}". Current fields: ${template.fields.map(f => f.label).join(', ')}`;
      const aiSuggestions = await getSuggestedFields(enhanceRequest);
      
      if (Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
        const aiEnhancedFields = aiSuggestions.map((suggestion, i) => {
          // Convert options from {label, value} format to simple strings if needed
          let options = [];
          if (suggestion.options) {
            if (Array.isArray(suggestion.options)) {
              options = suggestion.options.map(option => {
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
            } else if (typeof suggestion.options === 'string') {
              try {
                const parsed = JSON.parse(suggestion.options);
                options = Array.isArray(parsed) ? parsed.map(opt => 
                  typeof opt === 'string' ? opt : (opt.label || opt.value || String(opt))
                ) : [suggestion.options];
              } catch {
                options = [suggestion.options];
              }
            }
          }

          return {
            field_type: suggestion.field_type || suggestion.type || 'text',
            label: suggestion.label || `Enhanced Field ${i + 1}`,
            required: suggestion.required || false,
            placeholder: suggestion.placeholder || '',
            options: options
          };
        });

        const enhancedTemplate = {
          ...template,
          name: `Enhanced ${template.name}`,
          description: `${template.description} (Enhanced with AI)`,
          fields: [...template.fields, ...aiEnhancedFields]
        };

        onSelectTemplate(enhancedTemplate);
        onClose();
      } else {
        alert('AI failed to enhance the template. Please try again with a different description.');
      }
    } catch (err) {
      console.error('AI enhancement error:', err);
      alert('AI failed to enhance the template. Please try again.');
    } finally {
      setLoadingAI(false);
      setEnhancingTemplate(null);
      setEnhancePrompt('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Choose a Template</h2>
            <p className="text-gray-600 mt-1">Start with a pre-built form template and customize it</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* AI Assistant Card */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg p-6 mb-4">
              <div className="flex items-center mb-4">
                <div className="relative mr-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24" style={{ transform: 'rotate(2deg)' }}>
                      <path d="M12 1l2 9L24 12l-10 2L12 23l-2-9L0 12l10-2L12 1z" transform="translate(0,1)"/>
                      <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">✨ AI Assistant</h3>
                  <p className="text-purple-100">Describe your form and let AI create it for you</p>
                </div>
                <button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-md transition-colors"
                >
                  {showAIAssistant ? 'Hide' : 'Try AI'}
                </button>
              </div>
              
              {showAIAssistant && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Describe your form
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Contact form for a restaurant with name, email, phone, and message fields"
                      rows={3}
                      className="w-full px-3 py-2 text-gray-800 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-vertical"
                    />
                  </div>

                  <button
                    onClick={handleAIGenerate}
                    disabled={loadingAI || !aiPrompt.trim()}
                    className="bg-white text-purple-600 px-6 py-2 rounded-md font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loadingAI ? (
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" stroke="none" viewBox="0 0 24 24" style={{ transform: 'rotate(2deg)' }}>
                        <path d="M12 1l2 9L24 12l-10 2L12 23l-2-9L0 12l10-2L12 1z" transform="translate(0,1)"/>
                        <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                      </svg>
                    )}
                    <span>{loadingAI ? 'Generating...' : 'Generate Form with AI'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {filteredTemplates.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pre-built Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {template.name}
                      </h3>
                      <span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Fields:</span>
                      <span className="font-medium text-gray-700">{template.fields.length}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.fields.slice(0, 3).map((field, index) => (
                        <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {field.label}
                        </span>
                      ))}
                      {template.fields.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{template.fields.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Enhancement Section */}
                  {enhancingTemplate === template.id && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How should AI enhance this template?
                      </label>
                      <textarea
                        value={enhancePrompt}
                        onChange={(e) => setEnhancePrompt(e.target.value)}
                        placeholder="e.g., Add fields for social media links and company information"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEnhanceTemplate(template)}
                          disabled={loadingAI || !enhancePrompt.trim()}
                          className="flex-1 bg-purple-600 text-white px-3 py-2 text-sm rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                        >
                          {loadingAI && (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                          <span>{loadingAI ? 'Enhancing...' : 'Enhance'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setEnhancingTemplate(null);
                            setEnhancePrompt('');
                          }}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 text-sm rounded-md font-medium hover:bg-blue-700 transition-colors"
                    >
                      Use Template
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnhancingTemplate(enhancingTemplate === template.id ? null : template.id);
                        setEnhancePrompt('');
                      }}
                      className="px-3 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 rounded-md transition-colors flex items-center space-x-1"
                      title="Enhance with AI"
                    >
                      <svg className="w-3 h-3" fill="currentColor" stroke="none" viewBox="0 0 24 24" style={{ transform: 'rotate(2deg)' }}>
                        <path d="M12 1l2 9L24 12l-10 2L12 23l-2-9L0 12l10-2L12 1z" transform="translate(0,1)"/>
                        <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                      </svg>
                      <span>AI</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Choose a template, use AI assistant, or start from scratch
            </p>
            <button
              onClick={handleStartFromScratch}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Start from scratch instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
