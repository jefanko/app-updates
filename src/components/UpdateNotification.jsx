import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function UpdateNotification({ updateStatus, downloadProgress, onRestart, onClose }) {
    if (updateStatus === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-4 right-4 z-50"
            >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[320px] max-w-sm relative group">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
                        aria-label="Close notification"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Checking for updates */}
                    {updateStatus === 'checking' && (
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Checking for updates...</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Please wait</p>
                            </div>
                        </div>
                    )}

                    {/* Update available - downloading */}
                    {updateStatus === 'downloading' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Downloading update...</p>
                                </div>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{downloadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${downloadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Update will install automatically</p>
                        </div>
                    )}

                    {/* Downloaded - ready to install */}
                    {updateStatus === 'downloaded' && (
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Update downloaded!</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Ready to install</p>
                                </div>
                            </div>
                            <button
                                onClick={onRestart}
                                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Restart Now
                            </button>
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Or restart later manually</p>
                        </div>
                    )}

                    {/* No update available */}
                    {updateStatus === 'no-update' && (
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">You're up to date!</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Latest version installed</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {updateStatus === 'error' && (
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Update failed</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Will retry on next launch</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default UpdateNotification;
