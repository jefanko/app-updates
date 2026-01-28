import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../utils/formatters';

/**
 * TenderExpenseSection - Komponen untuk mengelola pengeluaran tender (INA Only)
 * Fitur: Add/Edit/Delete expense items dengan kalkulasi total otomatis
 */
function TenderExpenseSection({ expenses = [], onUpdate, canEdit = false }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newItem, setNewItem] = useState({ name: '', amount: '' });
    const [editItem, setEditItem] = useState({ name: '', amount: '' });

    // Calculate total
    const total = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Handle add new item
    const handleAdd = () => {
        if (!newItem.name.trim() || !newItem.amount) return;

        const amount = parseFloat(newItem.amount.replace(/\D/g, '')) || 0;
        const newExpense = {
            id: uuidv4(),
            name: newItem.name.trim(),
            amount: amount
        };

        onUpdate([...expenses, newExpense]);
        setNewItem({ name: '', amount: '' });
        setIsAdding(false);
    };

    // Handle edit item
    const handleStartEdit = (item) => {
        setEditingId(item.id);
        setEditItem({
            name: item.name,
            amount: item.amount.toLocaleString('id-ID')
        });
    };

    const handleSaveEdit = (id) => {
        if (!editItem.name.trim() || !editItem.amount) return;

        const amount = parseFloat(editItem.amount.replace(/\D/g, '')) || 0;
        const updated = expenses.map(item =>
            item.id === id ? { ...item, name: editItem.name.trim(), amount } : item
        );

        onUpdate(updated);
        setEditingId(null);
        setEditItem({ name: '', amount: '' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditItem({ name: '', amount: '' });
    };

    // Handle delete item
    const handleDelete = (id) => {
        onUpdate(expenses.filter(item => item.id !== id));
    };

    // Format currency input
    const formatAmount = (value) => {
        const numericValue = value.replace(/\D/g, '');
        return numericValue ? Number(numericValue).toLocaleString('id-ID') : '';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pengeluaran Tender</h3>
                </div>
                {canEdit && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Item
                    </button>
                )}
            </div>

            {/* Add New Item Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                                type="text"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="Nama item (misal: Bidbond)"
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                autoFocus
                            />
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">Rp</span>
                                <input
                                    type="text"
                                    value={newItem.amount}
                                    onChange={(e) => setNewItem({ ...newItem, amount: formatAmount(e.target.value) })}
                                    placeholder="0"
                                    className="w-full p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setIsAdding(false); setNewItem({ name: '', amount: '' }); }}
                                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!newItem.name.trim() || !newItem.amount}
                                className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50"
                            >
                                Simpan
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Expense List */}
            {expenses.length > 0 ? (
                <div className="space-y-2">
                    <AnimatePresence>
                        {expenses.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 group"
                            >
                                {editingId === item.id ? (
                                    // Edit Mode
                                    <>
                                        <input
                                            type="text"
                                            value={editItem.name}
                                            onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                                            className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            autoFocus
                                        />
                                        <div className="relative w-40">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">Rp</span>
                                            <input
                                                type="text"
                                                value={editItem.amount}
                                                onChange={(e) => setEditItem({ ...editItem, amount: formatAmount(e.target.value) })}
                                                className="w-full p-2 pl-7 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleSaveEdit(item.id)}
                                            className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    // View Mode
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                            {formatCurrency(item.amount)}
                                        </span>
                                        {canEdit && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => handleStartEdit(item)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pengeluaran</span>
                        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(total)}</span>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Belum ada pengeluaran tender</p>
                    {canEdit && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                            + Tambah item pertama
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default TenderExpenseSection;
