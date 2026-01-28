import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSearch({ clients, projects, onSelectResult }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ clients: [], projects: [] });
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    // Handle click outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Global Keyboard Shortcut for Search
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Press '/' to focus search
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Cari Project"]');
                if (searchInput) searchInput.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search Logic
    useEffect(() => {
        if (!query.trim()) {
            setResults({ clients: [], projects: [] });
            return;
        }

        const lowerQuery = query.toLowerCase();

        // 1. Search Clients
        const matchedClients = clients.filter(client =>
            client.name.toLowerCase().includes(lowerQuery)
        ).slice(0, 5); // Limit 5

        // 2. Search Projects (Metadata: Name, PIC, Location, Quotation No)
        const matchedProjects = projects.filter(project => {
            const nameMatch = project.name?.toLowerCase().includes(lowerQuery);
            const picMatch = project.pic?.toLowerCase().includes(lowerQuery);
            const locMatch = project.location?.toLowerCase().includes(lowerQuery);
            const quoteMatch = project.quotationNumber?.toLowerCase().includes(lowerQuery);

            return nameMatch || picMatch || locMatch || quoteMatch;
        }).slice(0, 10); // Limit 10

        setResults({ clients: matchedClients, projects: matchedProjects });
        setIsOpen(true);
    }, [query, clients, projects]);

    const handleSelect = (type, item) => {
        onSelectResult(type, item);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div className="relative w-full max-w-xl mx-auto" ref={searchRef}>
            {/* Search Input */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
                    placeholder="Cari Project, Client, PIC, Lokasi..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (query.trim()) setIsOpen(true);
                    }}
                />
                {/* Keyboard Shortcut Hint (Visual only) */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 dark:text-gray-500 text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">/</span>
                </div>
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
                {isOpen && (query.trim().length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[80vh] overflow-y-auto overflow-x-hidden"
                    >
                        {results.clients.length === 0 && results.projects.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                Tidak ditemukan hasil untuk "{query}"
                            </div>
                        ) : (
                            <div className="py-2">
                                {/* Clients Section */}
                                {results.clients.length > 0 && (
                                    <div className="mb-2">
                                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-700/50">
                                            Clients / Perusahaan
                                        </h3>
                                        <ul>
                                            {results.clients.map(client => (
                                                <li key={client.id}>
                                                    <button
                                                        onClick={() => handleSelect('client', client)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-3"
                                                    >
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">
                                                            {client.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Client</div>
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Projects Section */}
                                {results.projects.length > 0 && (
                                    <div>
                                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-700/50">
                                            Projects / Tender
                                        </h3>
                                        <ul>
                                            {results.projects.map(project => (
                                                <li key={project.id}>
                                                    <button
                                                        onClick={() => handleSelect('project', project)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-start gap-3"
                                                    >
                                                        <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${project.tenderStatus === 'Win' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                            project.tenderStatus === 'Lost' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                                                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                            }`}>
                                                            {project.tenderStatus === 'Win' ? 'W' : project.tenderStatus === 'Lost' ? 'L' : 'P'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.name}</div>

                                                            {/* Client Name (New) */}
                                                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                                {clients.find(c => c.id === project.clientId)?.name || 'Unknown Client'}
                                                            </div>

                                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {project.pic && (
                                                                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                        {project.pic}
                                                                    </span>
                                                                )}
                                                                {project.location && (
                                                                    <span className="truncate max-w-[100px]">{project.location}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
