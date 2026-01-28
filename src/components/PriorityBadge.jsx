import React from 'react';

const PRIORITY_STYLES = {
    Urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '🔴' },
    High: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: '🟡' },
    Normal: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: '🔵' },
    Low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', icon: '⚪' },
};

function PriorityBadge({ priority = 'Normal', onClick }) {
    const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Normal;

    return (
        <span
            onClick={onClick}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text} cursor-pointer hover:opacity-80 transition-opacity`}
        >
            <span className="text-[10px]">{style.icon}</span>
            {priority}
        </span>
    );
}

export default PriorityBadge;
