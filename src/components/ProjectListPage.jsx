import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectCard from './ProjectCard';

function ProjectListPage({
    projects,
    clients,
    onSelectProject,
    onUpdateProject,
    onDeleteProject,
    onAddProject,
    searchTerm,
    onSearchChange,
    sortConfig,
    onSortChange,
    isLoggedIn,
    currentUser
}) {
    return (
        <div className="max-w-6xl mx-auto px-4 pb-8 pt-8 md:px-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Daftar Proyek</h1>
                <p className="text-gray-500 dark:text-gray-400">Semua proyek kontraktor Anda</p>
            </div>

            {/* Project Search & Sort Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                {/* Search */}
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Cari Proyek..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Sort by:</span>
                    <select
                        value={`${sortConfig.key}-${sortConfig.direction}`}
                        onChange={onSortChange}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <option value="name-asc">Nama (A-Z)</option>
                        <option value="name-desc">Nama (Z-A)</option>
                        <option value="dueDate-asc">Deadline (Terdekat)</option>
                        <option value="dueDate-desc">Deadline (Terlama)</option>
                    </select>
                </div>
            </div>

            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode='popLayout'>
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={onSelectProject}
                            onAskDelete={onDeleteProject}
                            onUpdateProject={onUpdateProject}
                            isLoggedIn={isLoggedIn}
                            currentUser={currentUser}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {projects.length === 0 && (
                <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
                    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-200">Belum Ada Proyek</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
                        Belum ada proyek. Klik tombol '+' untuk menambah.
                    </p>
                </div>
            )}

            {isLoggedIn && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onAddProject(true)}
                    className="fixed bottom-8 right-8 bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-4xl font-light z-30 hover:bg-blue-700 transition"
                    aria-label="Tambah proyek baru"
                >
                    +
                </motion.button>
            )}
        </div>
    );
}

export default ProjectListPage;
