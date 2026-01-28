import React from 'react';
import { motion } from 'framer-motion';

function GaugeBar({ percentage }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
      <motion.div
        className="h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
        initial={{ width: "0%" }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </div>
  );
}

export default GaugeBar;
