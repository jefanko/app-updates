import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Format currency Indonesia
const formatCurrency = (value) => {
    if (!value) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('id-ID').format(num);
};

// Format date
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

// Data Table Component
function DataTable({ columns, data, searchTerm, title }) {
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(row =>
            Object.values(row).some(val =>
                String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">#</th>
                        {columns.map(col => (
                            <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700 whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                                No data found
                            </td>
                        </tr>
                    ) : (
                        filteredData.map((row, idx) => (
                            <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">{idx + 1}</td>
                                {columns.map(col => {
                                    let value = row[col];
                                    // Format special columns
                                    if (col.toLowerCase().includes('date') || col.toLowerCase().includes('tgl')) {
                                        value = formatDate(value);
                                    } else if (col.toLowerCase().includes('price') || col.toLowerCase().includes('amount') ||
                                        col.toLowerCase().includes('nominal') || col.toLowerCase().includes('total') ||
                                        col.toLowerCase().includes('quote') || col.toLowerCase().includes('harga')) {
                                        value = formatCurrency(value);
                                    }
                                    return (
                                        <td key={col} className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {value !== null && value !== undefined ? String(value) : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function FinanceSection({ currentUser }) {
    const [dbData, setDbData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSystemTables, setShowSystemTables] = useState(false);

    // Handle file selection
    const handleSelectFile = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check if running in Electron
            if (!window.electron?.accdb) {
                setError('This feature requires the desktop app (Electron)');
                setLoading(false);
                return;
            }

            const filePath = await window.electron.accdb.selectFile();
            if (!filePath) {
                setLoading(false);
                return;
            }

            const data = await window.electron.accdb.readDatabase(filePath);
            setDbData(data);

            // Set default tab to first non-system table
            const tables = Object.keys(data.tables).filter(name =>
                showSystemTables || !data.tables[name]?.isSystem
            );
            if (tables.length > 0) {
                setActiveTab(tables[0]);
            }
        } catch (err) {
            console.error('Error loading database:', err);
            setError(err.message || 'Failed to load database');
        } finally {
            setLoading(false);
        }
    };

    // Get visible tables (filtered by system table toggle)
    const visibleTables = useMemo(() => {
        if (!dbData) return [];
        return Object.keys(dbData.tables).filter(name =>
            showSystemTables || !dbData.tables[name]?.isSystem
        );
    }, [dbData, showSystemTables]);

    // Get current table data
    const currentTable = dbData?.tables?.[activeTab];

    // Stats (generic)
    const stats = useMemo(() => {
        if (!dbData) return null;
        const tables = dbData.tables;
        const userTables = Object.entries(tables).filter(([_, t]) => !t.isSystem);
        return {
            totalTables: visibleTables.length,
            totalAllTables: Object.keys(tables).length,
            totalRows: userTables.reduce((sum, [_, t]) => sum + (t.rowCount || 0), 0),
        };
    }, [dbData, visibleTables]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Finance Database</h2>
                            {dbData && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{dbData.fileName}</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleSelectFile}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        )}
                        {dbData ? 'Change Database' : 'Load Database'}
                    </button>
                </div>

                {error && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* No database loaded */}
            {!dbData && !loading && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Database Loaded</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Click "Load Database" to select an Access (.accdb) file</p>
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-2xl font-bold text-emerald-600">{stats.totalTables}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Tables {stats.totalAllTables > stats.totalTables && `(+${stats.totalAllTables - stats.totalTables} hidden)`}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalRows.toLocaleString('id-ID')}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Rows</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Show System Tables</div>
                        </div>
                        <button
                            onClick={() => setShowSystemTables(!showSystemTables)}
                            className={`w-12 h-6 rounded-full transition-colors ${showSystemTables ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${showSystemTables ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                        </button>
                    </div>
                </div>
            )}

            {/* Table Viewer */}
            {dbData && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-4">
                        <div className="flex items-center gap-2 overflow-x-auto py-2">
                            {visibleTables.map(name => {
                                const tableInfo = dbData.tables[name];
                                return (
                                    <button
                                        key={name}
                                        onClick={() => setActiveTab(name)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === name
                                            ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
                                            : tableInfo?.isSystem
                                                ? 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {tableInfo?.isSystem && '🔒 '}{name}
                                        <span className="ml-2 text-xs opacity-75">
                                            ({tableInfo?.rowCount || 0})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative max-w-md">
                            <input
                                type="text"
                                placeholder="Search in table..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="max-h-[500px] overflow-auto">
                        {currentTable?.error ? (
                            <div className="p-8 text-center text-red-500 dark:text-red-400">
                                Error loading table: {currentTable.error}
                            </div>
                        ) : currentTable ? (
                            <DataTable
                                columns={currentTable.columns}
                                data={currentTable.data}
                                searchTerm={searchTerm}
                                title={activeTab}
                            />
                        ) : (
                            <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                Select a table to view data
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FinanceSection;
