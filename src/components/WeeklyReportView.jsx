import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

function WeeklyReportView({ projects = [], clients = [], onUpdateProjectDetails, currentUser }) {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');

    // Get client name by ID
    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client?.name || '-';
    };

    // Get status color class
    const getStatusRowColor = (status) => {
        switch (status) {
            case 'Win': return 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50';
            case 'Loss': return 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50';
            case 'In progress': return 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50';
            case 'Quotation': return 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50';
            case 'Survey': return 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50';
            default: return 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700';
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Win': return 'bg-green-500 text-white';
            case 'Loss': return 'bg-red-500 text-white';
            case 'In progress': return 'bg-blue-500 text-white';
            case 'Quotation': return 'bg-amber-500 text-white shadow-sm';
            case 'Survey': return 'bg-purple-500 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    // Filter and search projects
    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => filterStatus === 'all' || p.tenderStatus === filterStatus)
            .filter(p =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getClientName(p.clientId)?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                // Sort by status priority: In progress > Quotation > Survey > Win > Loss
                const priority = { 'In progress': 0, 'Quotation': 1, 'Survey': 2, 'Win': 3, 'Loss': 4 };
                return (priority[a.tenderStatus] || 5) - (priority[b.tenderStatus] || 5);
            });
    }, [projects, filterStatus, searchTerm, clients]);

    // Format currency
    const formatCurrency = (value) => {
        if (!value) return '-';
        return new Intl.NumberFormat('id-ID').format(value);
    };

    // Get PIC name
    const getPICName = (project) => {
        if (!project.createdBy) return '-';
        return project.createdBy.name || project.createdBy.displayName || project.createdBy.email?.split('@')[0] || '-';
    };

    // Handle inline edit
    const handleStartEdit = (projectId, field, currentValue) => {
        setEditingCell({ projectId, field });
        setEditValue(currentValue || '');
    };

    const handleSaveEdit = async (project) => {
        if (!editingCell) return;

        const updates = {
            [editingCell.field]: editValue
        };

        // Convert camelCase to snake_case for Supabase
        const dbUpdates = {};
        if (editingCell.field === 'remarksKontraktor') dbUpdates.remarks_kontraktor = editValue;
        else if (editingCell.field === 'remarksPrinciple') dbUpdates.remarks_principle = editValue;
        else if (editingCell.field === 'remarksAI') dbUpdates.remarks_ai = editValue;
        else if (editingCell.field === 'remarks') dbUpdates.remarks = editValue;
        else if (editingCell.field === 'factory') dbUpdates.factory = editValue;
        else if (editingCell.field === 'insulator') dbUpdates.insulator = editValue;
        else dbUpdates[editingCell.field] = editValue;

        if (onUpdateProjectDetails) {
            await onUpdateProjectDetails(project.id, dbUpdates);
        }

        setEditingCell(null);
        setEditValue('');
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
        setEditValue('');
    };

    // Export to Excel
    const handleExportExcel = () => {
        const data = filteredProjects.map((project, index) => ({
            'No': index + 1,
            'Project Name': project.name || '',
            'Value': project.quotationPrice || '',
            'Status': project.tenderStatus || '',
            'Customer': getClientName(project.clientId),
            'Factory': project.factory || '',
            'Remarks Kontraktor': project.remarksKontraktor || '',
            'Remarks Principle': project.remarksPrinciple || '',
            'Remarks AI': project.remarksAI || '',
            'INSULATOR': project.insulator || '',
            'Remarks': project.remarks || '',
            'PIC': getPICName(project),
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');

        // Auto-width columns
        const colWidths = [
            { wch: 5 },   // No
            { wch: 30 },  // Project Name
            { wch: 15 },  // Value
            { wch: 12 },  // Status
            { wch: 20 },  // Customer
            { wch: 15 },  // Factory
            { wch: 25 },  // Remarks Kontraktor
            { wch: 25 },  // Remarks Principle
            { wch: 25 },  // Remarks AI
            { wch: 15 },  // INSULATOR
            { wch: 25 },  // Remarks
            { wch: 15 },  // PIC
        ];
        ws['!cols'] = colWidths;

        // Generate filename with date
        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Weekly_Report_${today}.xlsx`);
    };

    // Print - add print styles to hide app header and navigation
    const handlePrint = () => {
        // Add print styles dynamically
        const style = document.createElement('style');
        style.id = 'print-styles';
        style.textContent = `
            @media print {
                /* Hide header, navigation tabs, and other UI elements */
                header, nav, .print\\:hidden { display: none !important; }
                /* Hide the sticky tab navigation bar */
                .sticky { display: none !important; }
                /* Hide any fixed/sticky elements */
                [class*="sticky"], [class*="fixed"] { display: none !important; }
                /* Clean body */
                body { margin: 0; padding: 0; }
                .print-only { display: block !important; }
                /* Make report full width */
                .max-w-full, .max-w-7xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
            }
        `;
        document.head.appendChild(style);
        window.print();
        // Remove styles after print
        setTimeout(() => {
            document.getElementById('print-styles')?.remove();
        }, 1000);
    };

    // Status options
    const statusOptions = ['Survey', 'Quotation', 'In progress', 'Win', 'Loss'];

    // Status select cell component
    const StatusSelectCell = ({ project, currentStatus }) => {
        const isEditing = editingCell?.projectId === project.id && editingCell?.field === 'tenderStatus';

        if (isEditing) {
            return (
                <div className="flex items-center gap-1">
                    <select
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(project)}
                        className="px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100"
                    >
                        {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            );
        }

        return (
            <span
                onClick={() => handleStartEdit(project.id, 'tenderStatus', currentStatus)}
                className={`px-2 py-0.5 text-xs rounded-full cursor-pointer ${getStatusBadgeColor(currentStatus)}`}
                title="Click to change status"
            >
                {currentStatus}
            </span>
        );
    };

    // Editable value cell (for currency)
    const EditableValueCell = ({ project, value }) => {
        const isEditing = editingCell?.projectId === project.id && editingCell?.field === 'quotationPrice';

        if (isEditing) {
            return (
                <div className="flex items-center gap-1">
                    <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(project);
                            if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="w-24 px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100"
                    />
                    <button onClick={() => handleSaveEdit(project)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            );
        }

        return (
            <div
                onClick={() => handleStartEdit(project.id, 'quotationPrice', value || '')}
                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 px-1 py-0.5 rounded text-right font-mono text-xs dark:text-gray-300"
                title="Click to edit value"
            >
                {formatCurrency(value)}
            </div>
        );
    };

    // Editable cell component
    const EditableCell = ({ project, field, value }) => {
        const isEditing = editingCell?.projectId === project.id && editingCell?.field === field;

        if (isEditing) {
            return (
                <div className="flex items-center gap-1">
                    <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(project);
                            if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="w-full px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none dark:bg-gray-700 dark:border-gray-500 dark:text-gray-100"
                    />
                    <button onClick={() => handleSaveEdit(project)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            );
        }

        return (
            <div
                onClick={() => handleStartEdit(project.id, field, value)}
                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 px-1 py-0.5 rounded min-h-[20px] text-xs whitespace-pre-wrap break-words dark:text-gray-300"
                title="Click to edit"
            >
                {value || <span className="text-gray-300 dark:text-gray-600 italic">-</span>}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden print:shadow-none print:border-none">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Weekly Report
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {filteredProjects.length} of {projects.length} projects
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="In progress">In Progress</option>
                        <option value="Quotation">Quotation</option>
                        <option value="Survey">Survey</option>
                        <option value="Win">Win</option>
                        <option value="Loss">Loss</option>
                    </select>

                    {/* Export Buttons */}
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block p-4 border-b">
                <h1 className="text-xl font-bold text-center">Weekly Report - {new Date().toLocaleDateString('id-ID')}</h1>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0">
                        <tr>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 w-10">No</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[200px]">Project Name</th>
                            <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[100px]">Value</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[100px]">Status</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[120px]">Customer</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[100px]">Factory</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[150px]">Remarks Kontraktor</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[150px]">Remarks Principle</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[150px]">Remarks AI</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[100px]">INSULATOR</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[150px]">Remarks</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 min-w-[100px]">PIC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                                    No projects found
                                </td>
                            </tr>
                        ) : (
                            filteredProjects.map((project, index) => (
                                <motion.tr
                                    key={project.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`border-b dark:border-gray-700 ${getStatusRowColor(project.tenderStatus)} transition-colors`}
                                >
                                    <td className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400">{index + 1}</td>
                                    <td className="px-2 py-2 font-medium text-gray-900 dark:text-gray-100">{project.name}</td>
                                    <td className="px-2 py-2">
                                        <EditableValueCell project={project} value={project.quotationPrice} />
                                    </td>
                                    <td className="px-2 py-2">
                                        <StatusSelectCell project={project} currentStatus={project.tenderStatus} />
                                    </td>
                                    <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{getClientName(project.clientId)}</td>
                                    <td className="px-2 py-2">
                                        <EditableCell project={project} field="factory" value={project.factory} />
                                    </td>
                                    <td className="px-2 py-2">
                                        <EditableCell project={project} field="remarksKontraktor" value={project.remarksKontraktor} />
                                    </td>
                                    <td className="px-2 py-2">
                                        <EditableCell project={project} field="remarksPrinciple" value={project.remarksPrinciple} />
                                    </td>
                                    <td className="px-2 py-2">
                                        <EditableCell project={project} field="remarksAI" value={project.remarksAI} />
                                    </td>
                                    <td className="px-2 py-2">
                                        <EditableCell project={project} field="insulator" value={project.insulator} />
                                    </td>
                                    <td className="px-2 py-2">
                                        <EditableCell project={project} field="remarks" value={project.remarks} />
                                    </td>
                                    <td className="px-2 py-2 text-gray-600 dark:text-gray-400 text-xs">{getPICName(project)}</td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Stats */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 print:hidden">
                {/* Summary Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-6">
                        <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Total Projects:</span>
                            <span className="ml-2 font-bold text-gray-800 dark:text-white">{filteredProjects.length}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Total Value:</span>
                            <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                                Rp {formatCurrency(filteredProjects.filter(p => p.tenderStatus !== 'Loss').reduce((sum, p) => sum + (parseFloat(p.quotationPrice) || 0), 0))}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Status Legend */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-green-500"></span>
                        <span className="text-gray-600 dark:text-gray-400">Win: {projects.filter(p => p.tenderStatus === 'Win').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-blue-500"></span>
                        <span className="text-gray-600 dark:text-gray-400">In Progress: {projects.filter(p => p.tenderStatus === 'In progress').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-amber-500"></span>
                        <span className="text-gray-600 dark:text-gray-400">Quotation: {projects.filter(p => p.tenderStatus === 'Quotation').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-red-500"></span>
                        <span className="text-gray-600 dark:text-gray-400">Loss: {projects.filter(p => p.tenderStatus === 'Loss').length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WeeklyReportView;
