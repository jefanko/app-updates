import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import { useTheme } from '../context/ThemeContext';

function Header({ isLoggedIn, onLogout, onGoHome, onShowLogin, onOpenDataManagement, clients, projects, onSearchResultSelect, onSwitchOrg, selectedOrg, onRefresh, selectedYear, availableYears, onYearChange, onAddYear, notifications, onMarkNotificationAsRead, onMarkAllNotificationsAsRead, onNavigateToProject }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 gap-4">
          {/* Logo and Title */}
          <motion.div
            whileHover={{ x: 2 }}
            onClick={onGoHome}
            className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
          >
            <img
              className="h-8 w-8 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700"
              src="https://pbs.twimg.com/profile_images/1541353928071163905/DJxZXbFp_400x400.jpg"
              alt="Logo"
            />
            <span className="hidden md:block text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Alam Insektindo PM
            </span>
            <span className="md:hidden text-sm font-semibold text-gray-900 dark:text-gray-100">
              AIPM
            </span>
          </motion.div>

          {/* Global Search (Center) - Only show when logged in */}
          {isLoggedIn && (
            <div className="flex-1 max-w-xl mx-auto hidden sm:flex items-center gap-2">
              {/* Year Selector */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <select
                  value={selectedYear || new Date().getFullYear()}
                  onChange={(e) => onYearChange && onYearChange(parseInt(e.target.value))}
                  className="px-2 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg border-none cursor-pointer transition-colors"
                >
                  {(availableYears || [new Date().getFullYear()]).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <button
                  onClick={onAddYear}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="Add New Year"
                  aria-label="Add new year with JSON import"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="flex-1">
                <GlobalSearch
                  clients={clients}
                  projects={projects}
                  onSelectResult={onSearchResultSelect}
                />
              </div>
              <button
                onClick={onRefresh}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex-shrink-0"
                title="Refresh Data"
                aria-label="Refresh database from OneDrive"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}

          {/* Notification Bell & Login/Logout Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                // Moon Icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                // Sun Icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* Notification Bell - Only show when logged in */}
            {isLoggedIn && (
              <NotificationBell
                notifications={notifications || []}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onNavigateToProject={onNavigateToProject}
              />
            )}

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <span>Menu</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-100 dark:border-gray-700 z-50">
                    <button
                      onClick={() => {
                        onOpenDataManagement();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Backup & Restore
                    </button>
                    <button
                      onClick={() => {
                        onSwitchOrg();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Switch Organization
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onShowLogin}
                className="px-3.5 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}

export default Header;
