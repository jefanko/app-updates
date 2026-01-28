import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

const PRIORITIES = ["Urgent", "High", "Normal", "Low"];
const STATUSES = ["To Do", "In Progress", "Done", "Blocked"];

function MilestoneDetailModal({ isOpen, onClose, milestone, onSave }) {
    const [formData, setFormData] = useState({
        name: "",
        status: "To Do",
        priority: "Normal",
        description: "",
        startDate: "",
        dueDate: "",
        tags: []
    });
    const [newTag, setNewTag] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && milestone) {
            setFormData({
                name: milestone.name || "",
                status: milestone.status || "To Do",
                priority: milestone.priority || "Normal",
                description: milestone.description || "",
                startDate: milestone.startDate || "",
                dueDate: milestone.dueDate || "",
                tags: milestone.tags || []
            });
        }
    }, [isOpen, milestone]);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(newTag.trim())) {
                setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
            }
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await onSave(milestone.id, formData);
            onClose();
        } catch (error) {
            console.error("Gagal update milestone: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!milestone) return null;

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
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                            <div className="flex-1 mr-4">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="text-2xl font-bold text-gray-900 dark:text-white w-full border-none focus:ring-0 p-0 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent"
                                    placeholder="Task Name"
                                />
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            {/* Properties Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Status & Priority */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</label>
                                        <div className="flex flex-wrap gap-2">
                                            {STATUSES.map(status => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => handleChange('status', status)}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${formData.status === status
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-2 ring-blue-100 dark:ring-blue-900/50'
                                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Priority</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PRIORITIES.map(priority => (
                                                <div
                                                    key={priority}
                                                    onClick={() => handleChange('priority', priority)}
                                                    className={`cursor-pointer rounded-md p-1 border transition-all ${formData.priority === priority
                                                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30'
                                                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <PriorityBadge priority={priority} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => handleChange('startDate', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => handleChange('dueDate', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={4}
                                    className="w-full p-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-y placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Add a more detailed description..."
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Type tag and press Enter..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default MilestoneDetailModal;
