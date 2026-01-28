import React from 'react';

const STATUS_STYLES = {
    "To Do": { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
    "In Progress": { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    "Done": { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
    "Blocked": { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
};

function StatusBadge({ status = 'To Do', onClick }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES["To Do"];

    return (
        <span
            onClick={onClick}
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style.bg} ${style.text} ${style.border} cursor-pointer hover:opacity-80 transition-opacity uppercase tracking-wide`}
        >
            {status}
        </span>
    );
}

export default StatusBadge;
