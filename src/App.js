import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabase/client';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import EnhancedFormBuilder from './components/EnhancedFormBuilder';
import FormViewer from './components/FormViewer';
import FormSubmissions from './components/FormSubmissions';
import FormAnalytics from './components/FormAnalytics';

// Wrapper component for FormAnalytics to get formId from URL
function FormAnalyticsWrapper() {
  const { formId } = useParams();
  return <FormAnalytics formId={formId} />;
}

function App() {
  const [session, setSession] = useState(undefined); // default undefined to wait for auth load

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-40 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-cyan-500/25"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route path="/view/:formId" element={<FormViewer />} />
        
        {/* Protected routes - require authentication */}
        {!session ? (
          <Route path="*" element={<Auth />} />
        ) : (
          <>
            <Route path="/" element={<Dashboard session={session} />} />
            <Route path="/create" element={<EnhancedFormBuilder />} />
            <Route path="/edit/:formId" element={<EnhancedFormBuilder />} />
            <Route path="/submissions" element={<FormSubmissions />} />
            <Route path="/analytics/:formId" element={<FormAnalyticsWrapper />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
