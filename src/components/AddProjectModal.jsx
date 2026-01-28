import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTenderStatusOptions } from '../utils/formatters';

function AddProjectModal({ isOpen, onClose, onAddProject }) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    quotationNumber: "",
    quotationPrice: "",
    dueDate: "",
    pic: "",
    tenderStatus: "In progress"
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Convert price to number
      const projectData = {
        ...formData,
        quotationPrice: formData.quotationPrice ? parseFloat(formData.quotationPrice.replace(/\D/g, '')) : 0
      };

      await onAddProject(projectData);

      // Reset form
      setFormData({
        name: "",
        location: "",
        quotationNumber: "",
        quotationPrice: "",
        dueDate: "",
        pic: "",
        tenderStatus: "In progress"
      });
      onClose();
    } catch (error) {
      console.error("Gagal menambah proyek: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

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
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Buat Proyek Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project Name & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Proyek <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Misal: Aplikasi Web Toko Online"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Misal: Jakarta"
                  />
                </div>
              </div>

              {/* Quotation Number & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quotationNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nomor Quotation
                  </label>
                  <input
                    type="text"
                    id="quotationNumber"
                    value={formData.quotationNumber}
                    onChange={(e) => handleChange('quotationNumber', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Misal: QT-2024-001"
                  />
                </div>
                <div>
                  <label htmlFor="quotationPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Harga Quotation (Rp)
                  </label>
                  <input
                    type="text"
                    id="quotationPrice"
                    value={formData.quotationPrice}
                    onChange={(e) => {
                      // Allow only numbers and format with thousand separator
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value ? Number(value).toLocaleString('id-ID') : '';
                      handleChange('quotationPrice', formatted);
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Misal: 50.000.000"
                  />
                </div>
              </div>

              {/* Due Date & PIC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="pic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PIC (Person in Charge)
                  </label>
                  <input
                    type="text"
                    id="pic"
                    value={formData.pic}
                    onChange={(e) => handleChange('pic', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Misal: John Doe"
                  />
                </div>
              </div>

              {/* Tender Status */}
              <div>
                <label htmlFor="tenderStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status Tender
                </label>
                <select
                  id="tenderStatus"
                  value={formData.tenderStatus}
                  onChange={(e) => handleChange('tenderStatus', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {getTenderStatusOptions().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

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
                  {isLoading ? "Menyimpan..." : "Simpan & Lanjutkan"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AddProjectModal;
