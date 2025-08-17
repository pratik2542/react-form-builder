import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export default function FormShare({ form, formId }) {
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState('link');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      // Fetch all submissions for this form (public, no auth)
      let { data, error } = await supabase
        .from('form_submissions')
        .select('id, submission_data, submitted_at, submitter_name')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });
        
      // If submitter_name column doesn't exist, try without it
      if (error && error.message && (
        error.message.includes('column "submitter_name" does not exist') ||
        error.message.includes("'submitter_name' column") ||
        error.message.includes('schema cache')
      )) {
        console.log('submitter_name column does not exist, fetching without it');
        const result = await supabase
          .from('form_submissions')
          .select('id, submission_data, submitted_at')
          .eq('form_id', formId)
          .order('submitted_at', { ascending: false });
        data = result.data;
        error = result.error;
      }
      
      if (!error && data) setSubmissions(data);
      setLoading(false);
    }
    fetchSubmissions();
  }, [formId]);

  const baseUrl = window.location.origin;
  const formUrl = `${baseUrl}/view/${formId}`;
  const embedCode = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnSocial = (platform) => {
    const text = `Check out this form: ${form?.name || 'Custom Form'}`;
    const url = formUrl;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-lg p-6 drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]">
      <div className="flex items-center space-x-2 mb-6">
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Share Form</h3>
      </div>

      {/* Public Submissions List */}
      <div className="mb-8">
        <h4 className="text-md font-semibold text-white mb-2">Filled Submissions</h4>
        {loading ? (
          <div className="text-gray-400 text-sm">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="text-gray-400 text-sm">No one has filled this form yet.</div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {submissions.map((sub) => (
              <div key={sub.id} className="border border-gray-600/50 rounded p-3 bg-gray-800/50 backdrop-blur-sm">
                <div className="text-xs text-gray-400 mb-1">
                  Submitted: {new Date(sub.submitted_at).toLocaleString()}
                  {sub.submitter_name && sub.submitter_name !== 'Anonymous' && (
                    <span className="font-medium text-white"> by {sub.submitter_name}</span>
                  )}
                  {sub.submitter_name === 'Anonymous' && (
                    <span className="text-gray-400"> (anonymous)</span>
                  )}
                </div>
                <pre className="text-xs bg-gray-900/50 text-gray-300 p-2 rounded overflow-x-auto border border-gray-700/50">{JSON.stringify(sub.submission_data, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Method Tabs */}
      <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 mb-6">
        <button
          onClick={() => setShareMethod('link')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
            shareMethod === 'link'
              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Direct Link
        </button>
        <button
          onClick={() => setShareMethod('embed')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
            shareMethod === 'embed'
              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Embed Code
        </button>
        <button
          onClick={() => setShareMethod('social')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
            shareMethod === 'social'
              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Social Media
        </button>
      </div>

      {/* Share Content */}
      {shareMethod === 'link' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Form URL</label>
            <div className="flex">
              <input
                type="text"
                value={formUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-600/50 rounded-l-md bg-gray-800/50 backdrop-blur-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button
                onClick={() => copyToClipboard(formUrl)}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border border-l-0 transition-all duration-200 ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border-green-400/50'
                    : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-cyan-500 hover:from-purple-600 hover:to-cyan-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="bg-cyan-500/20 border border-cyan-400/30 rounded-md p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-cyan-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-cyan-300">Share this link</p>
                <p className="text-sm text-cyan-200">Anyone with this link can access and submit your form.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {shareMethod === 'embed' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Embed Code</label>
            <div className="relative">
              <textarea
                value={embedCode}
                readOnly
                rows={4}
                className="w-full px-3 py-2 border border-gray-600/50 rounded-md bg-gray-800/50 backdrop-blur-sm text-gray-300 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button
                onClick={() => copyToClipboard(embedCode)}
                className={`absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
                  copied
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600 shadow-lg'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="bg-amber-500/20 border border-amber-400/30 rounded-md p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-300">Embed on your website</p>
                <p className="text-sm text-amber-200">Copy this code and paste it into your HTML to embed the form.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {shareMethod === 'social' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Share on social platforms</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareOnSocial('twitter')}
                className="flex items-center justify-center space-x-2 p-3 border border-gray-600/50 rounded-md bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-200 text-gray-300 hover:text-white"
              >
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-sm font-medium">Twitter</span>
              </button>

              <button
                onClick={() => shareOnSocial('facebook')}
                className="flex items-center justify-center space-x-2 p-3 border border-gray-600/50 rounded-md bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-200 text-gray-300 hover:text-white"
              >
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </button>

              <button
                onClick={() => shareOnSocial('linkedin')}
                className="flex items-center justify-center space-x-2 p-3 border border-gray-600/50 rounded-md bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-200 text-gray-300 hover:text-white"
              >
                <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </button>

              <button
                onClick={() => shareOnSocial('whatsapp')}
                className="flex items-center justify-center space-x-2 p-3 border border-gray-600/50 rounded-md bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-200 text-gray-300 hover:text-white"
              >
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span className="text-sm font-medium">WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Share responsibly</p>
                <p className="text-sm text-gray-300">Make sure you have permission to share this form and that it complies with your organization's policies.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
