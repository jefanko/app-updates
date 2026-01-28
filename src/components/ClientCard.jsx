import React from 'react';
import { motion } from 'framer-motion';
import EditableText from './EditableText';

function ClientCard({ client, onSelect, onAskDelete, onUpdateClient, isLoggedIn }) {
    const handleSaveName = (newName) => {
        if (onUpdateClient && newName !== client.name) {
            onUpdateClient(client.id, newName);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            whileHover={{ y: -2 }}
            onClick={(e) => {
                if (!e.target.closest('.editable-text') && !e.target.closest('button')) {
                    onSelect(client.id);
                }
            }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all cursor-pointer relative group p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50"
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 editable-text min-w-0" onClick={(e) => e.stopPropagation()}>
                    <EditableText
                        value={client.name}
                        onSave={handleSaveName}
                        disabled={!isLoggedIn}
                        className="text-lg font-semibold text-gray-900 dark:text-white truncate"
                        placeholder="Client Name"
                    />
                </div>
                {isLoggedIn && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAskDelete('client', client);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all flex-shrink-0"
                        aria-label="Delete Client"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm">
                <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium">Client</span>
                </div>
                {client.createdAt && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(client.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\./g, '/')}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

export default ClientCard;
