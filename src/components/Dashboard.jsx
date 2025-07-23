import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import DraftManager from './DraftManager';
import { generateFormStructure } from '../utils/groq';

// Helper function to format creation time properly
const formatCreationTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  // If created within last 24 hours, show relative time
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
  }
  
  // Otherwise show full date and time
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Form Card Component
const FormCard = ({ form, onDelete }) => (
  <div className="group bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1">
    <div className="flex items-start justify-between mb-3">
      <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 line-clamp-2 flex-1">
        {form.name}
      </h3>
      <div className="flex gap-2 ml-2">
        <Link
          to={`/edit/${form.id}`}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
          title="Edit form"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
        <Link
          to={`/view/${form.id}`}
          className="p-1 text-gray-400 hover:text-green-500 transition-colors duration-200"
          title="View/Fill form"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
        <button
          onClick={() => onDelete(form.id, form.name)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
          title="Delete form"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
    
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center text-sm text-gray-500">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatCreationTime(form.created_at)}
      </div>
      {form.type && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {form.type}
        </span>
      )}
    </div>
    
    {/* Action Button */}
    <div className="flex">
      <Link
        to={`/view/${form.id}`}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        Fill Form
      </Link>
    </div>
  </div>
);

export default function Dashboard({ session }) {
  const userEmail = session?.user?.email;
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [showMobileWelcome, setShowMobileWelcome] = useState(false);
  const [isAutoClose, setIsAutoClose] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('category'); // 'category' or 'list'
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedForm, setAiGeneratedForm] = useState(null);
  const [showAiReviewModal, setShowAiReviewModal] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setForms(data);
    };

    fetchForms();
  }, []);

  // Check if welcome popup should be shown (only once after login)
  useEffect(() => {
    if (userEmail) {
      const welcomeKey = `welcome_shown_${userEmail}`;
      const hasShownWelcome = localStorage.getItem(welcomeKey);
      
      if (!hasShownWelcome) {
        setShowMobileWelcome(true);
        setIsAutoClose(true);
        // Mark as shown in localStorage
        localStorage.setItem(welcomeKey, 'true');
      }
    }
  }, [userEmail]);

  // Auto-close mobile welcome popup after 3 seconds only for initial load
  useEffect(() => {
    if (isAutoClose && showMobileWelcome) {
      const timer = setTimeout(() => {
        setShowMobileWelcome(false);
        setIsAutoClose(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isAutoClose, showMobileWelcome]);

  const handleShowUserInfo = () => {
    setIsAutoClose(false); // Disable auto-close
    setShowMobileWelcome(true);
  };

  const handleGenerateAiForm = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      console.log('Starting AI form generation with prompt:', aiPrompt);
      const generatedForm = await generateFormStructure(aiPrompt);
      console.log('Generated form structure:', generatedForm);
      setAiGeneratedForm(generatedForm);
      setShowAiModal(false);
      setShowAiReviewModal(true);
    } catch (error) {
      console.error('Detailed error in AI form generation:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to generate form: ${errorMessage}. Please check the console for details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save reviewed AI form to Supabase
  const handleSaveReviewedForm = async () => {
    if (!aiGeneratedForm) return;
    setIsGenerating(true);
    try {
      // Create the form in the database
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .insert({
          name: aiGeneratedForm.name,
          type: aiGeneratedForm.type,
          description: aiGeneratedForm.description,
          created_by: session?.user?.id
        })
        .select()
        .single();
      if (formError) {
        console.error('Form creation error:', formError);
        throw formError;
      }
      // Create the form fields
      if (aiGeneratedForm.fields && aiGeneratedForm.fields.length > 0) {
        const fieldsData = aiGeneratedForm.fields.map((field, index) => ({
          form_id: formData.id,
          field_type: field.type,
          label: field.label,
          options: field.options ? JSON.stringify(field.options) : null,
          display_order: index,
          is_required: field.required || false,
          is_readonly: false
        }));
        const { error: fieldsError } = await supabase
          .from('form_fields')
          .insert(fieldsData);
        if (fieldsError) {
          console.error('Fields creation error:', fieldsError);
          throw fieldsError;
        }
      }
      setShowAiReviewModal(false);
      setAiGeneratedForm(null);
      setAiPrompt('');
      // Refresh the forms list to show the new form
      const { data: updatedForms, error: fetchError } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fetchError) {
        setForms(updatedForms);
      }
      navigate(`/edit/${formData.id}`);
    } catch (error) {
      console.error('Error saving reviewed AI form:', error);
      alert('Failed to save form. Please check the console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  // (No local generateFormFromPrompt, use generateFormStructure directly)

  const handleDeleteForm = async (formId, formName) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the form "${formName}"?\n\nThis action cannot be undone and will also delete all form fields associated with this form.`
    );

    if (!isConfirmed) return;

    try {
      // First delete form fields
      const { error: fieldsError } = await supabase
        .from('form_fields')
        .delete()
        .eq('form_id', formId);

      if (fieldsError) {
        console.error('Error deleting form fields:', fieldsError);
        alert('Error deleting form fields: ' + fieldsError.message);
        return;
      }

      // Then delete the form
      const { error: formError } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (formError) {
        console.error('Error deleting form:', formError);
        alert('Error deleting form: ' + formError.message);
        return;
      }

      // Update local state to remove the deleted form
      setForms(prevForms => prevForms.filter(form => form.id !== formId));
      
      alert(`Form "${formName}" has been deleted successfully.`);
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      alert('An unexpected error occurred while deleting the form.');
    }
  };

  

  // Filter and search functionality
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || form.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort functionality
  const sortedForms = [...filteredForms].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Get unique categories
  const categories = [...new Set(forms.map(form => form.type).filter(Boolean))];

  // Create grouped structure from sorted and filtered forms
  const groupedFilteredForms = sortedForms.reduce((acc, form) => {
    acc[form.type] = acc[form.type] || [];
    acc[form.type].push(form);
    return acc;
  }, {});

  // Statistics
  const stats = {
    total: forms.length,
    categories: categories.length,
    recentForms: forms.filter(form => {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return new Date(form.created_at) > dayAgo;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile Welcome Popup - Only shows on mobile for 3 seconds */}
      {showMobileWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 sm:hidden">
          <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl p-6 max-w-sm w-full ${isAutoClose ? 'animate-pulse' : ''}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 100-5H9l-3 3m3-3l3 3m4-3h1.5a2.5 2.5 0 100-5H16l-3 3m3-3l3 3" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Welcome back!</h2>
              <p className="text-blue-100 text-sm mb-2 truncate">{userEmail}</p>
              <p className="text-blue-200 text-xs">Ready to build amazing forms?</p>
            </div>
            <button
              onClick={() => setShowMobileWelcome(false)}
              className="absolute top-2 right-2 text-white hover:text-blue-200 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="min-w-0 flex-1">
              {/* Mobile Design - Simple header with user info button */}
              <div className="block sm:hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-gray-800">
                    Dashboard
                  </div>
                  <button
                    onClick={handleShowUserInfo}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-full transition-colors duration-200"
                    title="View user info"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Desktop Design */}
              <div className="hidden sm:block text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-1">
                  <span>Welcome back,</span>
                  <span className="text-blue-600 break-words">{userEmail}</span>
                </div>
              </div>
              
              <p className="text-gray-600">Manage your forms and track submissions</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
              <Link 
                to="/create" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Form
              </Link>
              <button
                onClick={() => setShowAiModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Generate Form
              </button>
              <Link 
                to="/submissions" 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Submissions
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Compact Draft Manager Section */}
        <div className="mb-6">
          <DraftManager />
        </div>

        {/* Statistics Cards */}
        {forms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Forms</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Categories</p>
                  <p className="text-3xl font-bold">{stats.categories}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Recent (24h)</p>
                  <p className="text-3xl font-bold">{stats.recentForms}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search, Filter, and Controls */}
        {forms.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filters and Controls */}
              <div className="flex flex-wrap gap-3">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category || 'Uncategorized'}
                    </option>
                  ))}
                </select>

                {/* Sort Options */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Alphabetical</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode('category')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'category'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Category Buttons */}
            {categories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Quick Access:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({forms.length})
                  </button>
                  {categories.map(category => {
                    const count = forms.filter(form => form.type === category).length;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedCategory === category
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category || 'Uncategorized'} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forms Display */}
        {forms.length === 0 ? (
          /* Empty State - No forms at all */
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No forms created yet</h3>
            <p className="text-gray-500 mb-8">Create your first form to get started with collecting data</p>
            <Link 
              to="/create" 
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Form
            </Link>
          </div>
        ) : filteredForms.length === 0 ? (
          /* Empty State - No forms match filter */
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No forms found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? `No forms match "${searchTerm}"` : `No forms in "${selectedCategory}" category`}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === 'category' ? (
          /* Category View */
          <div className="space-y-8">
            {Object.entries(groupedFilteredForms).map(([type, categoryForms]) => (
              <div key={type} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{type || 'Uncategorized'}</h2>
                    <p className="text-gray-600">{categoryForms.length} form{categoryForms.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryForms.map((form) => (
                    <FormCard key={form.id} form={form} onDelete={handleDeleteForm} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">All Forms</h2>
                <p className="text-gray-600">{sortedForms.length} form{sortedForms.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedForms.map((form) => (
                <FormCard key={form.id} form={form} onDelete={handleDeleteForm} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Form Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Form Generator</h3>
                    <p className="text-purple-100 text-sm">Describe your form and let AI create it for you</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAiModal(false);
                    setAiPrompt('');
                  }}
                  className="text-white hover:text-purple-200 transition-colors"
                  disabled={isGenerating}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the form you want to create
                </label>
                <textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: Create a customer feedback form for a restaurant with rating questions and comments section..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about the type of form, questions you want, and any requirements.
                </p>
              </div>

              {/* Example Prompts */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Example prompts:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Customer feedback form for a restaurant with food quality and service ratings",
                    "Job application form with experience questions and file upload for resume",
                    "Event registration form with dietary preferences and special requirements",
                    "Contact form for business inquiries with company details and subject"
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setAiPrompt(example)}
                      className="text-left p-2 text-xs bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded transition-colors"
                      disabled={isGenerating}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGenerateAiForm}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Form...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Form
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAiModal(false);
                    setAiPrompt('');
                  }}
                  disabled={isGenerating}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Review Modal */}
      {showAiReviewModal && aiGeneratedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Review & Save AI-Generated Form</h3>
                  <p className="text-purple-100 text-sm">Review the generated form below. Edit if needed, then save.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAiReviewModal(false);
                  setAiGeneratedForm(null);
                }}
                className="text-white hover:text-purple-200 transition-colors"
                disabled={isGenerating}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={aiGeneratedForm.name}
                  onChange={e => setAiGeneratedForm(f => ({ ...f, name: e.target.value }))}
                  disabled={isGenerating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={aiGeneratedForm.description}
                  onChange={e => setAiGeneratedForm(f => ({ ...f, description: e.target.value }))}
                  disabled={isGenerating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fields</label>
                <div className="space-y-2">
                  {aiGeneratedForm.fields && aiGeneratedForm.fields.map((field, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 border p-2 rounded-lg">
                      <input
                        type="text"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded"
                        value={field.label}
                        onChange={e => setAiGeneratedForm(f => {
                          const fields = [...f.fields];
                          fields[idx] = { ...fields[idx], label: e.target.value };
                          return { ...f, fields };
                        })}
                        disabled={isGenerating}
                      />
                      <select
                        className="px-2 py-1 border border-gray-300 rounded"
                        value={field.type}
                        onChange={e => setAiGeneratedForm(f => {
                          const fields = [...f.fields];
                          fields[idx] = { ...fields[idx], type: e.target.value };
                          return { ...f, fields };
                        })}
                        disabled={isGenerating}
                      >
                        {['text','email','tel','textarea','select','radio','checkbox','number','date','url','file'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={!!field.required}
                          onChange={e => setAiGeneratedForm(f => {
                            const fields = [...f.fields];
                            fields[idx] = { ...fields[idx], required: e.target.checked };
                            return { ...f, fields };
                          })}
                          disabled={isGenerating}
                        />
                        Required
                      </label>
                      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded"
                          placeholder="Comma separated options"
                          value={field.options ? field.options.join(', ') : ''}
                          onChange={e => setAiGeneratedForm(f => {
                            const fields = [...f.fields];
                            fields[idx] = { ...fields[idx], options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                            return { ...f, fields };
                          })}
                          disabled={isGenerating}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={handleSaveReviewedForm}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                >
                  {isGenerating ? 'Saving...' : 'Save Form'}
                </button>
                <button
                  onClick={() => {
                    setShowAiReviewModal(false);
                    setAiGeneratedForm(null);
                  }}
                  disabled={isGenerating}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
