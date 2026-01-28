import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { database } from '../database/db';

export default function DataManagementModal({ isOpen, onClose }) {
    const [status, setStatus] = useState(''); // 'success', 'error', ''
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            const db = await database.getRaw();
            const dataStr = JSON.stringify(db, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `ina-ai-chart-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setStatus('success');
            setMessage('Data berhasil diexport!');
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Gagal export data.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);

                // Basic validation
                if (!json.users || !Array.isArray(json.clients) || !Array.isArray(json.projects)) {
                    throw new Error("Format file tidak valid");
                }

                // Save to localStorage or File System via db.js logic
                // We can use a direct write if we expose it, but for now let's use the import logic
                // Since we don't have a bulk import function in db.js exposed directly for full replace,
                // we might need to rely on the fact that db.js uses localStorage or FS.

                // However, since we are in the renderer, we should use the db.js write mechanism if possible.
                // But db.js doesn't expose a "overwrite whole db" function easily except via getRaw/writeDB internal.
                // Let's assume for now we just write to localStorage if in browser, or use electron API if available.

                if (window.electron && window.electron.db) {
                    await window.electron.db.write(json);
                } else {
                    localStorage.setItem('ina-ai-chart-db', JSON.stringify(json));
                }

                setStatus('success');
                setMessage('Data berhasil diimport! Aplikasi akan reload...');

                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error(error);
                setStatus('error');
                setMessage('Gagal import: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Backup & Restore</h2>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Kelola data aplikasi Anda. Export untuk backup, atau Import untuk memulihkan data.
                        </p>

                        {status && (
                            <div className={`mb-4 p-3 rounded-lg ${status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                {message}
                            </div>
                        )}

                        <div className="space-y-3">
                            {/* Electron-only: Set Database Location */}
                            {window.electron && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const newPath = await window.electron.db.setPath();
                                            if (newPath) {
                                                setStatus('success');
                                                setMessage(`Database dipindahkan ke: ${newPath}. Aplikasi akan reload...`);
                                                setTimeout(() => window.location.reload(), 2000);
                                            }
                                        } catch (e) {
                                            setStatus('error');
                                            setMessage('Gagal mengubah lokasi database');
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition font-medium border border-purple-200 dark:border-purple-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    Set Lokasi Database (OneDrive)
                                </button>
                            )}

                            <button
                                onClick={handleExport}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition font-medium border border-blue-200 dark:border-blue-800"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Data (Backup)
                            </button>

                            <div className="relative">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".json"
                                    className="hidden"
                                />
                                <button
                                    onClick={handleImportClick}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition font-medium border border-gray-300 dark:border-gray-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Import Data / Restore
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                            >
                                Tutup
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
