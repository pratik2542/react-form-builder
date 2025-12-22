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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-700/30 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-purple-900/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-800/30 bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Choose a Template</h2>
            <p className="text-purple-300 mt-1">Start with a pre-built form template and customize it</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-purple-400 hover:text-cyan-300 hover:bg-purple-800/30 rounded-lg transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-purple-800/30 bg-gray-800/30">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-purple-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-purple-300/50 transition-all duration-300"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/50 text-purple-300 hover:bg-purple-900/30 hover:text-white border border-purple-700/30'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
          {/* AI Assistant Card */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-cyan-900/40 border border-purple-500/30 rounded-xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                      <svg className="w-8 h-8 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                        <path d="M12 1l2 9L24 12l-10 2L12 23l-2-9L0 12l10-2L12 1z"/>
                        <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">AI Form Assistant</h3>
                    <p className="text-purple-200 text-sm">Describe your form and let AI create it for you instantly</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-sm font-medium whitespace-nowrap"
                >
                  {showAIAssistant ? 'Hide Assistant' : 'Try AI Assistant'}
                </button>
              </div>
              
              {showAIAssistant && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Describe your form
                      </label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., Create a customer satisfaction survey for a restaurant with rating fields, comment box, and contact info..."
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-900/60 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-purple-300/40 resize-none transition-all duration-300"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleAIGenerate}
                        disabled={loadingAI || !aiPrompt.trim()}
                        className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                      >
                        {loadingAI ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                            <path d="M12 1l2 9L24 12l-10 2L12 23l-2-9L0 12l10-2L12 1z"/>
                            <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                          </svg>
                        )}
                        <span>{loadingAI ? 'Generating Magic...' : 'Generate Form'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {filteredTemplates.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📚</span> Pre-built Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-gray-800/40 backdrop-blur-sm border border-purple-700/20 rounded-xl p-6 hover:bg-gray-800/60 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl p-3 bg-gray-900/50 rounded-xl border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                      {template.icon}
                    </div>
                    <span className="inline-block px-3 py-1 text-xs font-medium text-cyan-300 bg-cyan-900/20 border border-cyan-500/20 rounded-full">
                      {template.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {template.name}
                  </h3>
                  
                  <p className="text-purple-300/80 text-sm mb-6 line-clamp-2 flex-1">
                    {template.description}
                  </p>

                  <div className="space-y-4 mt-auto">
                    <div className="flex items-center justify-between text-xs text-purple-400/60 border-t border-purple-800/30 pt-4">
                      <span>Includes {template.fields.length} fields</span>
                      <div className="flex -space-x-2">
                        {template.fields.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-300">
                            {i + 1}
                          </div>
                        ))}
                        {template.fields.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-800 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-300">
                            +
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Enhancement Section */}
                    {enhancingTemplate === template.id && (
                      <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30 animate-fade-in">
                        <label className="block text-xs font-medium text-cyan-300 mb-2">
                          How should AI enhance this?
                        </label>
                        <textarea
                          value={enhancePrompt}
                          onChange={(e) => setEnhancePrompt(e.target.value)}
                          placeholder="e.g., Add social media links..."
                          rows={2}
                          className="w-full px-3 py-2 text-xs bg-gray-900/80 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white placeholder-purple-300/30 resize-none mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEnhanceTemplate(template)}
                            disabled={loadingAI || !enhancePrompt.trim()}
                            className="flex-1 bg-purple-600 text-white px-3 py-1.5 text-xs rounded-md font-medium hover:bg-purple-500 disabled:opacity-50"
                          >
                            {loadingAI ? 'Enhancing...' : 'Enhance'}
                          </button>
                          <button
                            onClick={() => {
                              setEnhancingTemplate(null);
                              setEnhancePrompt('');
                            }}
                            className="px-3 py-1.5 text-xs text-purple-300 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleTemplateSelect(template)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2.5 text-sm rounded-lg font-medium hover:from-purple-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-purple-500/25"
                      >
                        Use Template
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEnhancingTemplate(enhancingTemplate === template.id ? null : template.id);
                          setEnhancePrompt('');
                        }}
                        className={`px-3 py-2.5 rounded-lg transition-all duration-300 border ${
                          enhancingTemplate === template.id
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-transparent border-purple-600/30 text-purple-400 hover:text-cyan-300 hover:border-cyan-500/50'
                        }`}
                        title="Enhance with AI"
                      >
                        <svg className="w-5 h-5" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                          <path d="M12 1l2 9L24 12l-10 2L12 23l-2-9L0 12l10-2L12 1z"/>
                          <path d="M18 2l0.7 2.8L21.5 5.5l-2.8 0.7L18 9l-0.7-2.8L14.5 5.5l2.8-0.7L18 2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                <svg className="h-10 w-10 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No templates found</h3>
              <p className="text-purple-300">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-800/30 bg-gray-900/50 flex items-center justify-between">
          <p className="text-sm text-purple-300">
            Choose a template, use AI assistant, or start from scratch
          </p>
          <button
            onClick={handleStartFromScratch}
            className="px-6 py-2.5 text-sm font-medium text-purple-300 hover:text-white hover:bg-purple-800/20 rounded-lg transition-all duration-300 border border-transparent hover:border-purple-500/30"
          >
            Start from scratch instead
          </button>
        </div>
      </div>
    </div>
  );
}
