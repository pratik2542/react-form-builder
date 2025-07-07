import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const auth = {
  // Sign up new user
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in existing user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out current user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database functions for forms
export const database = {
  // Create a new form
  createForm: async (userId, formData) => {
    const { data, error } = await supabase
      .from('forms')
      .insert([
        {
          user_id: userId,
          title: formData.title,
          fields: formData.fields,
          created_at: new Date().toISOString(),
        }
      ])
      .select();
    return { data, error };
  },

  // Get all forms for a user
  getUserForms: async (userId) => {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Get a specific form by ID
  getForm: async (formId) => {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    return { data, error };
  },

  // Update a form
  updateForm: async (formId, formData) => {
    const { data, error } = await supabase
      .from('forms')
      .update({
        title: formData.title,
        fields: formData.fields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formId)
      .select();
    return { data, error };
  },

  // Delete a form
  deleteForm: async (formId) => {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId);
    return { error };
  },

  // Submit form response
  submitFormResponse: async (formId, responseData) => {
    const { data, error } = await supabase
      .from('form_responses')
      .insert([
        {
          form_id: formId,
          responses: responseData,
          submitted_at: new Date().toISOString(),
        }
      ])
      .select();
    return { data, error };
  },

  // Get form responses
  getFormResponses: async (formId) => {
    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false });
    return { data, error };
  }
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to changes in user's forms
  subscribeToUserForms: (userId, callback) => {
    return supabase
      .channel('forms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forms',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to form responses
  subscribeToFormResponses: (formId, callback) => {
    return supabase
      .channel('form_responses')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'form_responses',
          filter: `form_id=eq.${formId}`,
        },
        callback
      )
      .subscribe();
  }
};

export default supabase;
