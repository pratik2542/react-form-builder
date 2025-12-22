import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import SubmissionFormView from './SubmissionFormView';

export default function FormSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Function to generate consistent color for form names
  const getFormNameColor = (formName) => {
    if (!formName) return 'from-gray-400 to-gray-500';
    
    // Create a simple hash from the form name
    let hash = 0;
    for (let i = 0; i < formName.length; i++) {
      const char = formName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Define color combinations that work well with dark theme
    const colorCombinations = [
      'from-cyan-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-rose-400 to-red-500',
      'from-indigo-400 to-purple-500',
      'from-emerald-400 to-green-500',
      'from-amber-400 to-yellow-500',
      'from-violet-400 to-purple-500',
      'from-teal-400 to-cyan-500',
      'from-orange-400 to-red-500',
      'from-sky-400 to-blue-500',
    ];
    
    // Use absolute value and modulo to get consistent index
    const index = Math.abs(hash) % colorCombinations.length;
    return colorCombinations[index];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          alert('Please log in to view submissions');
          return;
        }

        // Fetch user's forms
        const { data: formsData, error: formsError } = await supabase
          .from('forms')
          .select('id, name, type, created_at')
          .eq('created_by', user.data.user.id)
          .order('created_at', { ascending: false });

        if (!formsError) {
          setForms(formsData || []);
        }

        // Fetch submissions for user's forms (try with field_metadata first, fallback without)
        let submissionsData = null;
        let submissionsError = null;
        
        // Try to fetch with field_metadata column
        const { data: newSubmissions, error: newError } = await supabase
          .from('form_submissions')
          .select(`
            id,
            form_id,
            submission_data,
            field_metadata,
            submitter_name,
            submitted_at,
            forms!inner(name, type, created_by)
          `)
          .eq('forms.created_by', user.data.user.id)
          .order('submitted_at', { ascending: false });

        if (newError && newError.message && (
          newError.message.includes('column "field_metadata" does not exist') ||
          newError.message.includes('column "submitter_name" does not exist') ||
          newError.message.includes("'field_metadata' column") ||
          newError.message.includes("'submitter_name' column") ||
          newError.message.includes('schema cache')
        )) {
          console.log('One or more columns do not exist, fetching with minimal data');
          // Fallback: fetch with minimal columns only
          const { data: oldSubmissions, error: oldError } = await supabase
            .from('form_submissions')
            .select(`
              id,
              form_id,
              submission_data,
              submitted_at,
              forms!inner(name, type, created_by)
            `)
            .eq('forms.created_by', user.data.user.id)
            .order('submitted_at', { ascending: false });
          
          submissionsData = oldSubmissions;
          submissionsError = oldError;
        } else {
          submissionsData = newSubmissions;
          submissionsError = newError;
        }

        if (!submissionsError) {
          setSubmissions(submissionsData || []);
          console.log('Submissions loaded:', submissionsData);
        } else {
          console.error('Error fetching submissions:', submissionsError);
          // Check if table doesn't exist and show fallback
          if (submissionsError.message && submissionsError.message.includes('relation "public.form_submissions" does not exist')) {
            // Try to get from localStorage as fallback
            const localSubmissions = JSON.parse(localStorage.getItem('form_submissions') || '[]');
            setSubmissions(localSubmissions);
            console.log('Using localStorage submissions:', localSubmissions);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSubmissions = selectedForm === 'all' 
    ? submissions 
    : submissions.filter(sub => sub.form_id === selectedForm);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
          <p className="text-gray-300">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-blue-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-purple-300 hover:text-cyan-300 font-medium mb-4 transition-all duration-300 hover:translate-x-[-4px]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-700/30 p-6 sm:p-8 shadow-purple-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">Form Submissions</h1>
                <p className="text-purple-300">View and manage your form responses</p>
              </div>
              <button 
                onClick={() => setShowInfoModal(true)}
                className="mt-4 sm:mt-0 flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-purple-900/30 text-purple-300 hover:text-white rounded-full transition-all duration-300 border border-purple-500/30 hover:border-cyan-500/50"
                title="Help"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl shadow-lg border border-purple-700/30 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <label className="text-sm font-medium text-purple-300 whitespace-nowrap">Filter by form:</label>
              <div className="relative flex-1 max-w-md">
                <select 
                  value={selectedForm} 
                  onChange={(e) => setSelectedForm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-purple-600/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm text-white backdrop-blur-sm appearance-none cursor-pointer hover:bg-gray-800/70 transition-colors"
                >
                  <option value="all">All Forms</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>{form.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-purple-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-sm text-purple-300/70 sm:ml-auto bg-purple-900/20 px-3 py-1 rounded-full border border-purple-500/20">
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Submissions Content */}
        {selectedSubmission ? (
          /* Full-width form view */
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-2xl border border-purple-700/30 overflow-hidden animate-fade-in">
            <div className="p-4 sm:p-6 border-b border-purple-800/30 bg-gray-800/30 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">📝</span> Form View
              </h2>
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="text-sm text-purple-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-purple-800/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              <SubmissionFormView 
                submission={selectedSubmission} 
                onBack={() => setSelectedSubmission(null)} 
              />
            </div>
          </div>
        ) : (
          /* Submissions table */
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-2xl border border-purple-700/30 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 sm:p-6 border-b border-purple-800/30 bg-gray-800/30">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-purple-400">📥</span> Recent Submissions
              </h2>
            </div>
            
            <div className="overflow-y-auto flex-1 scrollbar-hide p-2">
              {filteredSubmissions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-800/50 rounded-full flex items-center justify-center border border-purple-500/20">
                    <svg className="w-10 h-10 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No submissions yet</h3>
                  <p className="text-purple-300 max-w-sm">Share your forms to start collecting responses. They will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSubmissions.map((submission) => (
                    <div 
                      key={submission.id}
                      onClick={() => setSelectedSubmission(submission)}
                      className={`group p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        selectedSubmission?.id === submission.id 
                          ? 'bg-purple-900/30 border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                          : 'bg-gray-800/40 border-purple-800/20 hover:bg-gray-800/60 hover:border-purple-500/40 hover:shadow-md hover:shadow-purple-500/5'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold text-lg truncate bg-clip-text text-transparent bg-gradient-to-r ${getFormNameColor(submission.forms?.name)}`}>
                              {submission.forms?.name || 'Unknown Form'}
                            </h3>
                            {submission.stored_locally && (
                              <span className="text-[10px] bg-yellow-500/10 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase tracking-wider font-bold">
                                Local
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-purple-300/70">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {submission.forms?.type || 'Form'}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {submission.submitter_name === 'Anonymous' ? 'Anonymous User' : submission.submitter_name || 'Unknown User'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                          <span className="text-xs text-gray-400 font-mono">
                            {formatDate(submission.submitted_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(submission);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full hover:bg-cyan-500/20"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-purple-700/30 shadow-purple-900/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-cyan-400">ℹ️</span> Data Preservation
                  </h3>
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="text-purple-400 hover:text-white transition-colors p-1 hover:bg-purple-800/30 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-900/40 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm leading-relaxed">
                      <p className="text-emerald-200/90">
                        Form submissions are <strong className="text-emerald-300">permanently preserved</strong> exactly as they were submitted. 
                      </p>
                      <p className="text-emerald-200/70 mt-2">
                        Even if you edit or delete the original form, the submission data remains intact with the original field names and values.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium border border-gray-700"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
