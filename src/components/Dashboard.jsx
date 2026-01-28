import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, getTenderStatusStyle } from '../utils/formatters';

function Dashboard({ projects, clients, onNavigateToProject, selectedOrg, onSwitchOrg, currentUser }) {
    const [filterMode, setFilterMode] = useState(null); // 'win', 'lost', 'active', or null

    // --- Statistics Calculation ---
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.tenderStatus === 'In progress');
    const wonProjects = projects.filter(p => p.tenderStatus === 'Win');
    const lostProjects = projects.filter(p => p.tenderStatus === 'Loss');

    const winRate = totalProjects > 0 ? Math.round((wonProjects.length / (wonProjects.length + lostProjects.length || 1)) * 100) : 0;

    const totalPotentialValue = projects
        .filter(p => p.tenderStatus === 'In progress')
        .reduce((sum, p) => sum + (p.quotationPrice || 0), 0);

    const totalContractValue = projects
        .filter(p => p.tenderStatus === 'Win')
        .reduce((sum, p) => sum + (p.quotationPrice || 0), 0);

    // --- Approaching Deadlines Logic (Next 7 Days) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const approachingDeadlines = projects
        .filter(p => {
            if (!p.dueDate || p.tenderStatus !== 'In progress') return false;
            const due = new Date(p.dueDate);
            return due >= today && due <= nextWeek;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // --- Recent Activity (Last 5 updated/created) ---
    const recentProjects = [...projects]
        .sort((a, b) => {
            const dateA = a.updatedAt || a.createdAt || 0;
            const dateB = b.updatedAt || b.createdAt || 0;
            return new Date(dateB) - new Date(dateA);
        })
        .slice(0, 5);

    // --- Filtered list based on clicked stat ---
    const getFilteredProjects = () => {
        if (filterMode === 'win') return wonProjects;
        if (filterMode === 'lost') return lostProjects;
        if (filterMode === 'active') return activeProjects;
        return null;
    };

    const filteredProjects = getFilteredProjects();

    // Get user display name
    const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hello, {userName}! 👋</h1>
                <p className="text-gray-500 dark:text-gray-400">Selamat datang kembali! Berikut ringkasan aktivitas proyek Anda.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {/* Active Projects Card with Preview */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border transition-all ${filterMode === 'active'
                            ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-500'
                            : 'border-gray-100 dark:border-gray-700'
                        } ${activeProjects.length > 0 ? 'cursor-pointer hover:shadow-md' : ''}`}
                    onClick={() => activeProjects.length > 0 && setFilterMode(filterMode === 'active' ? null : 'active')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {selectedOrg === 'INA' ? 'Proyek On Bid' : 'Proyek Aktif'}
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{activeProjects.length}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                    </div>

                    {/* Preview List */}
                    {activeProjects.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                            {activeProjects.slice(0, 3).map(project => (
                                <div key={project.id} className="flex items-start gap-2 text-xs group">
                                    <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{project.name}</span>
                                </div>
                            ))}
                            {activeProjects.length > 3 && (
                                <p className="text-xs text-gray-400 italic pl-3">
                                    +{activeProjects.length - 3} lainnya
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Win and Lost Cards - Separate but grouped */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 flex flex-col gap-2">
                    {/* Win Card */}
                    <div
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all rounded-lg ${filterMode === 'win' ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500' : ''}`}
                        onClick={() => setFilterMode(filterMode === 'win' ? null : 'win')}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {selectedOrg === 'INA' ? 'Proyek Running' : 'Proyek Menang'}
                                </p>
                                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">{wonProjects.length}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {selectedOrg === 'INA' ? 'Sedang dikerjakan' : `Win Rate: ${winRate}%`}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Lost Section (Bottom) */}
                    <div
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all rounded-lg ${filterMode === 'lost' ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500' : ''}`}
                        onClick={() => setFilterMode(filterMode === 'lost' ? null : 'lost')}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Proyek Kalah</p>
                                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{lostProjects.length}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {selectedOrg === 'INA' ? 'Tender gagal' : `Dari ${wonProjects.length + lostProjects.length} selesai`}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30">
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Combined Potensi Nilai / Nilai Kontrak Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Potensi Nilai Section (Top) - Bidding */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Potensi Nilai</p>
                                <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-500">{formatCurrency(totalPotentialValue)}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {selectedOrg === 'INA' ? 'Proyek on bid' : 'Proyek bidding aktif'}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30">
                                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Nilai Kontrak Section (Bottom) - Won */}
                    <div className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nilai Kontrak</p>
                                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(totalContractValue)}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {selectedOrg === 'INA' ? 'Proyek running' : 'Proyek yang menang'}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtered Projects List (shown when a stat is clicked) */}
            {filteredProjects && (
                <div className="mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                {filterMode === 'win' && (selectedOrg === 'INA' ? '🚀 Proyek Running' : '🏆 Proyek Menang')}
                                {filterMode === 'lost' && '💔 Proyek Kalah'}
                                {filterMode === 'active' && (selectedOrg === 'INA' ? '📋 Proyek On Bid' : '🔄 Proyek Aktif')}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    {filteredProjects.length} Proyek
                                </span>
                                <button
                                    onClick={() => setFilterMode(null)}
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
                            {filteredProjects.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <p>Tidak ada proyek dalam kategori ini.</p>
                                </div>
                            ) : (
                                filteredProjects.map(project => {
                                    const statusStyle = getTenderStatusStyle(project.tenderStatus);
                                    return (
                                        <motion.div
                                            key={project.id}
                                            whileHover={{ backgroundColor: "#f9fafb" }} // Note: Framer Motion color interpolation might need hex for dark mode too, or use CSS hover
                                            className="p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                            onClick={() => onNavigateToProject(project)}
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{project.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {clients.find(c => c.id === project.clientId)?.name || 'Unknown Client'}
                                                    </span>
                                                    {project.dueDate && (
                                                        <span className="text-xs text-gray-400">
                                                            • {formatDate(project.dueDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {project.quotationPrice > 0 && (
                                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(project.quotationPrice)}
                                                    </span>
                                                )}
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {statusStyle.icon} {project.tenderStatus}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Approaching Deadlines Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Mendekati Deadline (7 Hari)
                            </h2>
                            <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {approachingDeadlines.length}
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {approachingDeadlines.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <p>Tidak ada deadline mendesak minggu ini. 🎉</p>
                                </div>
                            ) : (
                                approachingDeadlines.map(project => (
                                    <motion.div
                                        key={project.id}
                                        className="p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                        onClick={() => onNavigateToProject(project)}
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{project.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                    {clients.find(c => c.id === project.clientId)?.name || 'Unknown Client'}
                                                </span>
                                                {project.pic && (
                                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                                        {project.pic}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end flex-shrink-0">
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                                {formatDate(project.dueDate)}
                                            </span>
                                            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                                                {getDaysRemaining(project.dueDate)} hari lagi
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Activity / All Active Projects Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Aktivitas Terbaru</h2>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {recentProjects.map(project => {
                                const statusStyle = getTenderStatusStyle(project.tenderStatus);
                                return (
                                    <motion.div
                                        key={project.id}
                                        className="p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                        onClick={() => onNavigateToProject(project)}
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{project.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                Updated: {formatDate(project.updatedAt || project.createdAt)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                {statusStyle.icon} {project.tenderStatus}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Side Column: Quick Actions / Summary */}
                <div className="space-y-6">
                    {/* Mini Calendar or Summary could go here */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-lg font-bold mb-2">Butuh Bantuan?</h3>
                        <p className="text-blue-100 text-sm mb-4">
                            Gunakan fitur Global Search (tekan <kbd className="bg-blue-500 px-1 rounded">/</kbd>) untuk mencari tender dengan cepat berdasarkan nama, lokasi, atau PIC.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, subtext, onClick, isActive }) {
    const baseClasses = "bg-white rounded-xl p-6 shadow-sm border flex items-start justify-between transition-all";
    const clickableClasses = onClick ? "cursor-pointer hover:shadow-md hover:scale-102" : "";
    const activeClasses = isActive ? "ring-2 ring-blue-500 border-blue-300" : "border-gray-100";

    return (
        <div
            className={`${baseClasses} ${clickableClasses} ${activeClasses}`}
            onClick={onClick}
        >
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
        </div>
    );
}

function getDaysRemaining(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

export default Dashboard;
