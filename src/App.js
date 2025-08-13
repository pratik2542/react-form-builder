import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabase/client';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import EnhancedFormBuilder from './components/EnhancedFormBuilder';
import FormViewer from './components/FormViewer';
import FormSubmissions from './components/FormSubmissions';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
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
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
