import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function AddYearModal({ isOpen, onClose, onAddYear, existingYears }) {
    const [year, setYear] = useState(new Date().getFullYear() + 1);
    const [jsonData, setJsonData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // Validate JSON structure
                if (!data.clients || !data.projects) {
                    setError('Invalid JSON format. Must contain "clients" and "projects" arrays.');
                    setJsonData(null);
                    return;
                }
                setJsonData(data);
            } catch (err) {
                setError('Failed to parse JSON file. Please check the format.');
                setJsonData(null);
            }
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!year || year < 2020 || year > 2100) {
            setError('Please enter a valid year (2020-2100)');
            return;
        }

        if (existingYears && existingYears.includes(year)) {
            setError(`Year ${year} already exists. Please choose a different year.`);
            return;
        }

        if (!jsonData) {
            setError('Please select a JSON file to import');
            return;
        }

        setIsLoading(true);
        try {
            await onAddYear(year, jsonData);
            handleClose();
        } catch (err) {
            setError('Failed to add year: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setYear(new Date().getFullYear() + 1);
        setJsonData(null);
        setFileName('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Year</h2>
                        <button
                            onClick={handleClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Year Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value) || '')}
                                min="2020"
                                max="2100"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="e.g. 2026"
                            />
                        </div>

                        {/* JSON File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Import JSON Data
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {fileName ? (
                                    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm font-medium">{fileName}</span>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload JSON file</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Must contain clients and projects data</p>
                                    </>
                                )}
                            </div>
                            {jsonData && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    ✓ Found {jsonData.clients?.length || 0} clients and {jsonData.projects?.length || 0} projects
                                </p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !jsonData}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                            >
                                {isLoading ? 'Adding...' : 'Add Year'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default AddYearModal;
