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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
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
          
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Form Submissions</h1>
              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-colors duration-200"
                title="Information about preserved form data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600">View and manage form submissions</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="text-sm font-medium text-gray-700">Filter by form:</label>
            <select 
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Forms</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>
                  {form.name} ({form.type})
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500">
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Submissions Content */}
        {selectedSubmission ? (
          /* Full-width form view */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Form View</h2>
              </div>
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
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Submissions</h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredSubmissions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No submissions found</h3>
                  <p className="text-gray-500">No one has submitted any forms yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <div 
                      key={submission.id}
                      onClick={() => setSelectedSubmission(submission)}
                      className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedSubmission?.id === submission.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                          {submission.forms?.name || 'Unknown Form'}
                        </h3>
                        <div className="flex items-center gap-2">
                          {submission.stored_locally && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Local
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(submission);
                            }}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                            title="View as filled form"
                          >
                            View Form
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Type: {submission.forms?.type || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {formatDate(submission.submitted_at)}
                        {submission.submitter_name && submission.submitter_name !== 'Anonymous' && (
                          <span className="font-medium text-gray-700"> by {submission.submitter_name}</span>
                        )}
                        {submission.submitter_name === 'Anonymous' && (
                          <span className="text-gray-500"> (anonymous)</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Preserved Form Data</h3>
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                      <p className="text-green-700">
                        Form submissions are preserved exactly as they were submitted, with the original field names and data. 
                        You can edit, update, or delete forms without affecting previously submitted data.
                        Use the <strong>Form View</strong> button to see submissions as they appeared when filled out.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
