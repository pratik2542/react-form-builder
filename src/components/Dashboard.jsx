import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import DraftManager from './DraftManager';
import { generateFormStructure } from '../utils/groq';

// Share Modal Component
const ShareModal = ({ isOpen, onClose, formUrl, formTitle }) => {
  if (!isOpen) return null;

  const shareText = `Check out this form: ${formTitle}`;
  const encodedUrl = encodeURIComponent(formUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      ),
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'Twitter',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      color: 'bg-blue-400 hover:bg-blue-500',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    },
    {
      name: 'Instagram',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      url: `https://www.instagram.com/` // Instagram doesn't support direct URL sharing, so we'll just link to Instagram
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formUrl).then(() => {
      // Show success feedback
      const copyBtn = document.querySelector('.copy-btn');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    }).catch(() => {
      alert(`Form link: ${formUrl}`);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Share Form</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">Share "{formTitle}" with others</p>
        
        <div className="space-y-3">
          {shareOptions.map((option) => (
            <a
              key={option.name}
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${option.color} text-white px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors duration-200 w-full`}
            >
              {option.icon}
              <span className="font-medium">Share on {option.name}</span>
            </a>
          ))}
          
          <button
            onClick={copyToClipboard}
            className="copy-btn bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors duration-200 w-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

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
const FormCard = ({ form, onDelete, onShare }) => (
  <div className="group bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1">
    <div className="flex items-start justify-between mb-3">
      <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 line-clamp-2 flex-1 text-sm sm:text-base">
        {form.name}
      </h3>
      <div className="flex items-center gap-1 sm:gap-2 ml-2 flex-shrink-0">
        <Link
          to={`/edit/${form.id}`}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
          title="Edit form"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
        <Link
          to={`/view/${form.id}`}
          className="p-1 text-gray-400 hover:text-green-500 transition-colors duration-200"
          title="View/Fill form"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
        <button
          onClick={() => onDelete(form.id, form.name)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
          title="Delete form"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
    
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
      <div className="flex items-center text-xs sm:text-sm text-gray-500 flex-shrink-0">
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="truncate">{formatCreationTime(form.created_at)}</span>
      </div>
      {form.type && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0 self-start sm:self-center">
          {form.type}
        </span>
      )}
    </div>
    
    {/* Action Buttons */}
    <div className="flex flex-col gap-2">
      <Link
        to={`/view/${form.id}`}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        Fill Form
      </Link>
      
      <div className="flex gap-2">
        <Link
          to={`/analytics/${form.id}`}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all duration-200 text-center shadow-sm hover:shadow-md flex items-center justify-center"
          title="View form analytics"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics
        </Link>
        
        <button
          onClick={() => onShare(form)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all duration-200 text-center shadow-sm hover:shadow-md flex items-center justify-center"
          title="Share form"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Share
        </button>
      </div>
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
  const [shareModal, setShareModal] = useState({ isOpen: false, formUrl: '', formTitle: '' });

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

  const handleShare = (form) => {
    const formUrl = `${window.location.origin}/view/${form.id}`;
    setShareModal({
      isOpen: true,
      formUrl: formUrl,
      formTitle: form.name
    });
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 sm:p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm">Total Forms</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 sm:p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm">Categories</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.categories}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 sm:p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs sm:text-sm">Recent (24h)</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.recentForms}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <FormCard key={form.id} form={form} onDelete={handleDeleteForm} onShare={handleShare} />
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
                <FormCard key={form.id} form={form} onDelete={handleDeleteForm} onShare={handleShare} />
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

      {/* Share Modal */}
      <ShareModal 
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, formUrl: '', formTitle: '' })}
        formUrl={shareModal.formUrl}
        formTitle={shareModal.formTitle}
      />
    </div>
  );
}
