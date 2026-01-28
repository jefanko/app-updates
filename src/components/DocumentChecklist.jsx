import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ChecklistDetail({
    checklist,
    onUpdate,
    onDelete,
    onBack,
    isLoggedIn
}) {
    const [items, setItems] = useState(checklist?.items || []);
    const [approvers, setApprovers] = useState(checklist?.approvers || []);
    const [deficiencies, setDeficiencies] = useState(checklist?.deficiencies || '');
    const [newItemText, setNewItemText] = useState('');
    const [newApproverName, setNewApproverName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Editable name and description
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(checklist?.name || '');
    const [editDescription, setEditDescription] = useState(checklist?.description || '');

    // Handle add item
    const handleAddItem = () => {
        if (!newItemText.trim()) return;
        const newItem = {
            id: Date.now().toString(),
            requirement: newItemText.trim(),
            checked: false,
            remarks: '',
            file: null
        };
        setItems(prev => [...prev, newItem]);
        setNewItemText('');
    };

    // Handle toggle item
    const handleToggleItem = (itemId) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        ));
    };

    // Handle update item remarks
    const handleUpdateRemarks = (itemId, remarks) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, remarks } : item
        ));
    };

    // Handle delete item
    const handleDeleteItem = (itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Handle attach file
    const handleAttachFile = async (itemId) => {
        if (!window.electron?.checklist) {
            alert('This feature requires the desktop app');
            return;
        }

        const result = await window.electron.checklist.attachFile(checklist.id, itemId);
        if (result) {
            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, file: result } : item
            ));
        }
    };

    // Handle open file
    const handleOpenFile = async (filePath) => {
        if (window.electron?.checklist) {
            await window.electron.checklist.openFile(filePath);
        }
    };

    // Handle remove file
    const handleRemoveFile = (itemId) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, file: null } : item
        ));
    };

    // Approver handlers
    const handleAddApprover = () => {
        if (!newApproverName.trim()) return;
        setApprovers(prev => [...prev, {
            id: Date.now().toString(),
            name: newApproverName.trim(),
            approved: false,
            remarks: ''
        }]);
        setNewApproverName('');
    };

    const handleUpdateApprover = (id, field, value) => {
        setApprovers(prev => prev.map(a =>
            a.id === id ? { ...a, [field]: value } : a
        ));
    };

    const handleRemoveApprover = (id) => {
        setApprovers(prev => prev.filter(a => a.id !== id));
    };

    // Generate ZIP
    const handleGenerateZip = async () => {
        const files = items
            .filter(item => item.file?.filePath)
            .map(item => ({
                fileName: item.file.fileName,
                filePath: item.file.filePath
            }));

        if (files.length === 0) {
            alert('No files attached to generate ZIP');
            return;
        }

        if (!window.electron?.checklist) {
            alert('This feature requires the desktop app');
            return;
        }

        const result = await window.electron.checklist.generateZip(
            checklist.id,
            files,
            checklist.name.replace(/[^a-zA-Z0-9]/g, '-')
        );

        if (result) {
            alert(`ZIP created successfully!\nLocation: ${result.path}\nSize: ${(result.size / 1024).toFixed(1)} KB`);
        }
    };

    // Save
    const handleSave = async () => {
        if (!onUpdate) return;
        setIsSaving(true);
        try {
            await onUpdate(checklist.id, {
                name: editName,
                description: editDescription,
                items,
                approvers,
                deficiencies
            });
            setIsEditingName(false);
        } finally {
            setIsSaving(false);
        }
    };

    // Stats
    const stats = useMemo(() => {
        const total = items.length;
        const checked = items.filter(i => i.checked).length;
        const withFiles = items.filter(i => i.file).length;
        return { total, checked, withFiles, percent: total > 0 ? Math.round((checked / total) * 100) : 0 };
    }, [items]);

    if (!checklist) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        {isEditingName ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full text-lg font-semibold px-2 py-1 border border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Checklist name..."
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full text-sm px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                    placeholder="Description (optional)..."
                                />
                            </div>
                        ) : (
                            <div
                                onClick={() => isLoggedIn && setIsEditingName(true)}
                                className={isLoggedIn ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-1 -mx-1" : ""}
                                title={isLoggedIn ? "Click to edit" : ""}
                            >
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{editName || checklist.name}</h2>
                                {(editDescription || checklist.description) && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{editDescription || checklist.description}</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {stats.checked}/{stats.total} • {stats.percent}%
                        </span>
                        <button
                            onClick={handleGenerateZip}
                            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                            title="Generate ZIP"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            ZIP
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 dark:bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? '...' : 'Save'}
                        </button>
                        {isLoggedIn && (
                            <button
                                onClick={() => {
                                    if (confirm('Delete this checklist permanently?')) {
                                        onDelete(checklist.id);
                                        onBack();
                                    }
                                }}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete checklist"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Item */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        placeholder="Add new document requirement..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button
                        onClick={handleAddItem}
                        disabled={!newItemText.trim()}
                        className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 transition-colors"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* Items List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                        No items yet. Add your first document requirement above.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${item.checked ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => handleToggleItem(item.id)}
                                        className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${item.checked
                                            ? 'bg-green-500 border-green-500 dark:bg-green-500 dark:border-green-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        {item.checked && (
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{idx + 1}.</span>
                                            <span className={`text-sm ${item.checked ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {item.requirement}
                                            </span>
                                        </div>

                                        {/* File & Remarks */}
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            {item.file ? (
                                                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                                    <svg className="w-3 h-3 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    <button
                                                        onClick={() => handleOpenFile(item.file.filePath)}
                                                        className="text-blue-600 dark:text-blue-400 hover:underline max-w-[150px] truncate"
                                                    >
                                                        {item.file.fileName}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFile(item.id)}
                                                        className="text-red-400 hover:text-red-600 dark:hover:text-red-400"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAttachFile(item.id)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    Attach
                                                </button>
                                            )}

                                            <input
                                                type="text"
                                                value={item.remarks || ''}
                                                onChange={(e) => handleUpdateRemarks(item.id, e.target.value)}
                                                placeholder="Remarks..."
                                                className="flex-1 min-w-[150px] px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                                            />

                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approvers Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Approvers</h3>
                </div>
                <div className="p-4 space-y-3">
                    {approvers.map((approver) => (
                        <div key={approver.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <button
                                onClick={() => handleUpdateApprover(approver.id, 'approved', !approver.approved)}
                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${approver.approved
                                    ? 'bg-green-500 border-green-500 dark:bg-green-500 dark:border-green-500 text-white'
                                    : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            >
                                {approver.approved && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                    </svg>
                                )}
                            </button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">{approver.name}</span>
                            <input
                                type="text"
                                value={approver.remarks || ''}
                                onChange={(e) => handleUpdateApprover(approver.id, 'remarks', e.target.value)}
                                placeholder="Remarks..."
                                className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <button
                                onClick={() => handleRemoveApprover(approver.id)}
                                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newApproverName}
                            onChange={(e) => setNewApproverName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddApprover()}
                            placeholder="Add approver name..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                            onClick={handleAddApprover}
                            disabled={!newApproverName.trim()}
                            className="px-3 py-2 bg-purple-600 dark:bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 transition-colors"
                        >
                            + Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Deficiencies */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kekurangan / Deficiencies</label>
                <textarea
                    value={deficiencies}
                    onChange={(e) => setDeficiencies(e.target.value)}
                    rows={3}
                    placeholder="List any deficiencies or missing items..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
            </div>
        </div>
    );
}

export default ChecklistDetail;
