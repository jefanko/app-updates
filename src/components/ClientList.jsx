import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientCard from './ClientCard';

function ClientList({
    clients,
    onSelectClient,
    onAddClient,
    searchTerm,
    onSearchChange,
    isLoggedIn,
    onAskDelete,
    onUpdateClient,
    isSidebar = false
}) {
    return (
        <div className={`mx-auto px-4 pb-8 md:px-6 ${isSidebar ? 'pt-0' : 'pt-8 max-w-6xl'}`}>
            <div className={`flex flex-col ${isSidebar ? '' : 'md:flex-row md:items-center'} justify-between mb-6 gap-3`}>
                <div>
                    <h1 className={`font-bold text-gray-900 dark:text-white ${isSidebar ? 'text-xl' : 'text-2xl'}`}>
                        Clients
                    </h1>
                    {!isSidebar && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Kelola daftar klien dan proyek Anda</p>
                    )}
                </div>

                {/* Search Bar */}
                <div className={`relative w-full ${isSidebar ? '' : 'md:w-64'}`}>
                    <input
                        type="text"
                        placeholder="Cari Client..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className={`grid gap-4 ${isSidebar ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                <AnimatePresence>
                    {clients.map(client => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onSelect={onSelectClient}
                            onAskDelete={onAskDelete}
                            onUpdateClient={onUpdateClient}
                            isLoggedIn={isLoggedIn}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {clients.length === 0 && (
                <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
                    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">Belum Ada Client</h3>
                    {!isSidebar && (
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
                            Belum ada client yang sesuai dengan pencarian Anda.
                        </p>
                    )}
                </div>
            )}

            {isLoggedIn && !isSidebar && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onAddClient(true)} // Assuming onAddClient opens modal, passing true or just calling it
                    className="fixed bottom-8 right-8 bg-blue-600 dark:bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-4xl font-light z-30 hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                    aria-label="Tambah client baru"
                >
                    +
                </motion.button>
            )}
        </div>
    );
}

export default ClientList;
