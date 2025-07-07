import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export default function DebugSupabase() {
  const [debugInfo, setDebugInfo] = useState({
    url: null,
    keyPresent: false,
    connection: null,
    auth: null,
    tablesExist: {},
    user: null
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      const info = {
        url: process.env.REACT_APP_SUPABASE_URL || 'NOT_SET',
        keyPresent: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
        connection: null,
        auth: null,
        tablesExist: {},
        user: null
      };

      try {
        // Test connection to forms table
        const { error: formsError } = await supabase
          .from('forms')
          .select('count')
          .limit(1);
        
        info.connection = formsError ? 'FAILED' : 'SUCCESS';
        info.tablesExist.forms = !formsError;

        // Test form_submissions table
        const { error: submissionsError } = await supabase
          .from('form_submissions')
          .select('count')
          .limit(1);
        
        info.tablesExist.form_submissions = !submissionsError;

        // Test form_fields table
        const { error: fieldsError } = await supabase
          .from('form_fields')
          .select('count')
          .limit(1);
        
        info.tablesExist.form_fields = !fieldsError;

        // Test authentication
        const { data: userData, error: authError } = await supabase.auth.getUser();
        info.auth = authError ? 'FAILED' : 'SUCCESS';
        info.user = userData?.user?.email || 'Not authenticated';

      } catch (error) {
        info.connection = 'ERROR: ' + error.message;
      }

      setDebugInfo(info);
    };

    runDiagnostics();
  }, []);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔍 Supabase Debug Information</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Supabase URL:</span>
          <span className={debugInfo.url === 'NOT_SET' ? 'text-red-600' : 'text-green-600'}>
            {debugInfo.url}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>API Key Present:</span>
          <span className={debugInfo.keyPresent ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.keyPresent ? 'YES' : 'NO'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Connection Status:</span>
          <span className={debugInfo.connection === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.connection || 'Testing...'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Authentication:</span>
          <span className={debugInfo.auth === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.auth || 'Testing...'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Current User:</span>
          <span className="text-gray-700">{debugInfo.user || 'Loading...'}</span>
        </div>
        
        <div className="border-t pt-2 mt-3">
          <h4 className="font-medium text-gray-800 mb-2">Table Existence:</h4>
          {Object.entries(debugInfo.tablesExist).map(([table, exists]) => (
            <div key={table} className="flex justify-between ml-4">
              <span>{table}:</span>
              <span className={exists ? 'text-green-600' : 'text-red-600'}>
                {exists ? 'EXISTS' : 'MISSING'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {!debugInfo.tablesExist.form_submissions && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">
            ⚠️ The <code>form_submissions</code> table is missing. Please run the SQL script 
            <code>create_submissions_table.sql</code> in your Supabase SQL editor.
          </p>
        </div>
      )}
    </div>
  );
}
