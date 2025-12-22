import { useState } from 'react';
import { supabase } from '../supabase/client';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    let result;
    
    try {
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      if (result.error) {
        alert(result.error.message);
      } else {
        if (!isLogin) {
          alert('Success! Please check your email for the confirmation link.');
        } else {
          // Redirect is handled by App.js session state change
          window.location.href = '/';
        }
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex relative overflow-x-hidden overflow-y-auto">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-pink-500/20 rounded-full mix-blend-screen filter blur-[80px] animate-pulse animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center lg:justify-between relative z-10 min-h-screen">
        
        {/* Left Side: Hero Content */}
        <div className="w-full lg:w-1/2 text-center lg:text-left mb-8 lg:mb-0 lg:pr-12 order-2 lg:order-1">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-cyan-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6 backdrop-blur-sm">
            <span className="flex h-2 w-2 relative mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            New: AI Form Generation
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Build Powerful Forms <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              in Seconds with AI
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Create, share, and analyze forms with our intelligent form builder. 
            No coding required. Just describe what you need, and let AI do the rest.
          </p>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/60 transition-colors duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4 border border-cyan-500/20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-white font-semibold text-sm sm:text-base">AI Powered</h3>
                <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">Generate forms from text</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/60 transition-colors duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4 border border-purple-500/20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-white font-semibold text-sm sm:text-base">Analytics</h3>
                <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">Real-time insights</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/60 transition-colors duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4 border border-emerald-500/20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-white font-semibold text-sm sm:text-base">Secure</h3>
                <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">Enterprise-grade security</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/60 transition-colors duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4 border border-orange-500/20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-white font-semibold text-sm sm:text-base">Customizable</h3>
                <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">Drag & drop builder</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full lg:w-1/2 max-w-md order-1 lg:order-2 mb-8 lg:mb-0">
          <div className="bg-gradient-to-br from-gray-800/80 via-slate-800/80 to-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-600/50 relative overflow-hidden group">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25 transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="text-gray-400">
                  {isLogin ? 'Sign in to access your dashboard' : 'Create your free account today'}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-white placeholder-gray-500 backdrop-blur-sm"
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-white placeholder-gray-500 backdrop-blur-sm"
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                      required
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleAuth} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transform hover:-translate-y-1 flex items-center justify-center border border-cyan-500/30 mt-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
                
                <div className="text-center pt-2">
                  <button 
                    onClick={() => setIsLogin(!isLogin)} 
                    className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200 flex items-center justify-center mx-auto group/link"
                  >
                    {isLogin ? (
                      <>
                        Don't have an account? <span className="text-cyan-400 ml-1 group-hover/link:underline">Sign up</span>
                      </>
                    ) : (
                      <>
                        Already have an account? <span className="text-cyan-400 ml-1 group-hover/link:underline">Sign in</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Links */}
          <div className="mt-8 text-center text-xs text-gray-500 flex justify-center space-x-6">
            <button type="button" className="hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer">Privacy Policy</button>
            <button type="button" className="hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer">Terms of Service</button>
            <button type="button" className="hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}
