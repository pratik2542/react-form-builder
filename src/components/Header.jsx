import React from 'react';

const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-gray-800/90 backdrop-blur-xl shadow-2xl border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">FormBuilder</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a
              href="#dashboard"
              className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Dashboard
            </a>
            <a
              href="#forms"
              className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              My Forms
            </a>
            <a
              href="#builder"
              className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Create Form
            </a>
          </nav>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                  <span className="text-sm font-medium text-white">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-white hidden sm:block">
                  {user.email}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium border border-gray-600/50 hover:border-cyan-400/50 bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                Sign In
              </button>
              <button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <a
            href="#dashboard"
            className="text-gray-300 hover:text-cyan-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
          >
            Dashboard
          </a>
          <a
            href="#forms"
            className="text-gray-300 hover:text-cyan-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
          >
            My Forms
          </a>
          <a
            href="#builder"
            className="text-gray-300 hover:text-cyan-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
          >
            Create Form
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
