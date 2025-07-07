import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { Link } from 'react-router-dom';
import DraftManager from './DraftManager';

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

export default function Dashboard({ session }) {
  const userEmail = session?.user?.email;
  const [forms, setForms] = useState([]);
  const [showMobileWelcome, setShowMobileWelcome] = useState(false);
  const [isAutoClose, setIsAutoClose] = useState(false);

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

  const grouped = forms.reduce((acc, form) => {
    acc[form.type] = acc[form.type] || [];
    acc[form.type].push(form);
    return acc;
  }, {});

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

        {/* Draft Manager Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-gray-100">
          <DraftManager />
        </div>

        {/* Forms by Category */}
        {Object.keys(grouped).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([type, forms]) => (
              <div key={type} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{type || 'Uncategorized'}</h2>
                    <p className="text-gray-600">{forms.length} form{forms.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      className="group bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
                    >
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
                            onClick={() => handleDeleteForm(form.id, form.name)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                            title="Delete form"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatCreationTime(form.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
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
        )}
      </div>
    </div>
  );
}
