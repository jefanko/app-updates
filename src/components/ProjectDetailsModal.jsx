import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTenderStatusOptions } from '../utils/formatters';

function ProjectDetailsModal({ isOpen, onClose, project, onSave }) {
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        quotationNumber: "",
        quotationPrice: "",
        dueDate: "",
        pic: "",
        tenderStatus: "In progress",
        bastNumber: ""  // Nomor BAST (INA only)
    });
    const [isLoading, setIsLoading] = useState(false);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen && project) {
            setFormData({
                name: project.name || "",
                location: project.location || "",
                quotationNumber: project.quotationNumber || "",
                quotationPrice: project.quotationPrice ? project.quotationPrice.toLocaleString('id-ID') : "",
                dueDate: project.dueDate || "",
                pic: project.pic || "",
                tenderStatus: project.tenderStatus || "In progress",
                bastNumber: project.bastNumber || ""  // Nomor BAST (INA only)
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // Remove 'project' to prevent resetting while typing due to background polling

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || isLoading) return;

        setIsLoading(true);
        try {
            // Convert price to number
            const updates = {
                name: formData.name,
                location: formData.location,
                quotationNumber: formData.quotationNumber,
                quotationPrice: formData.quotationPrice ? parseFloat(formData.quotationPrice.replace(/\D/g, '')) : 0,
                dueDate: formData.dueDate || null,
                pic: formData.pic,
                tenderStatus: formData.tenderStatus,
                bastNumber: formData.bastNumber || null  // Nomor BAST (INA only)
            };

            await onSave(project.id, updates);
            onClose();
        } catch (error) {
            console.error("Gagal update project: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    if (!project) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Edit Detail Proyek</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Project Name & Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="editProjectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nama Proyek <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="editProjectName"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Misal: Aplikasi Web Toko Online"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Lokasi
                                    </label>
                                    <input
                                        type="text"
                                        id="editLocation"
                                        value={formData.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Misal: Jakarta"
                                    />
                                </div>
                            </div>

                            {/* Quotation Number & Price */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="editQuotationNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nomor Quotation
                                    </label>
                                    <input
                                        type="text"
                                        id="editQuotationNumber"
                                        value={formData.quotationNumber}
                                        onChange={(e) => handleChange('quotationNumber', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Misal: QT-2024-001"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editQuotationPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Harga Quotation (Rp)
                                    </label>
                                    <input
                                        type="text"
                                        id="editQuotationPrice"
                                        value={formData.quotationPrice}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            const formatted = value ? Number(value).toLocaleString('id-ID') : '';
                                            handleChange('quotationPrice', formatted);
                                        }}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Misal: 50.000.000"
                                    />
                                </div>
                            </div>

                            {/* Due Date & PIC */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="editDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        id="editDueDate"
                                        value={formData.dueDate}
                                        onChange={(e) => handleChange('dueDate', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editPic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        PIC (Person in Charge)
                                    </label>
                                    <input
                                        type="text"
                                        id="editPic"
                                        value={formData.pic}
                                        onChange={(e) => handleChange('pic', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Misal: John Doe"
                                    />
                                </div>
                            </div>

                            {/* Tender Status */}
                            <div>
                                <label htmlFor="editTenderStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status Tender
                                </label>
                                <select
                                    id="editTenderStatus"
                                    value={formData.tenderStatus}
                                    onChange={(e) => handleChange('tenderStatus', e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {getTenderStatusOptions().map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            {/* BAST Number - INA Only */}
                            {project.org === 'INA' && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                                    <label htmlFor="editBastNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nomor BAST (Berita Acara Serah Terima)
                                    </label>
                                    <input
                                        type="text"
                                        id="editBastNumber"
                                        value={formData.bastNumber}
                                        onChange={(e) => handleChange('bastNumber', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Misal: BAST/INA/2026/001"
                                    />
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                    disabled={isLoading}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                                    disabled={!formData.name.trim() || isLoading}
                                >
                                    {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ProjectDetailsModal;
