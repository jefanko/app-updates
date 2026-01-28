import React from 'react';
import { motion } from 'framer-motion';
import companyInaLogo from '../assets/companyLogo/companyINA.png';

export default function SelectionPage({ onSelect }) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-gray-800 dark:text-white mb-12"
            >
                Pilih Organisasi
            </motion.h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* AI Option */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect('AI')}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 cursor-pointer flex flex-col items-center justify-center aspect-square hover:shadow-2xl transition-shadow border border-transparent dark:border-gray-700"
                >
                    <img
                        className="h-32 w-32 rounded-full mb-6 object-cover"
                        src="https://pbs.twimg.com/profile_images/1541353928071163905/DJxZXbFp_400x400.jpg"
                        alt="Alam Insektindo"
                    />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Alam Insektindo</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Project Management</p>
                </motion.div>

                {/* INA Option */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect('INA')}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 cursor-pointer flex flex-col items-center justify-center aspect-square hover:shadow-2xl transition-shadow border border-transparent dark:border-gray-700"
                >
                    <img
                        className="h-32 w-32 rounded-full mb-6 object-cover"
                        src={companyInaLogo}
                        alt="INA"
                    />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">INA</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Project Management</p>
                </motion.div>
            </div>
        </div>
    );
}
