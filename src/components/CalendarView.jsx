import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function CalendarView({ projects = [], onNavigateToProject }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get calendar data
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    // Navigation
    const goToPrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDate(null);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null);
    };

    // Get projects for a specific date
    const getProjectsForDate = (date) => {
        const dateString = date.toISOString().split('T')[0];
        return projects.filter(p => {
            if (!p.dueDate) return false;
            const projectDate = new Date(p.dueDate).toISOString().split('T')[0];
            return projectDate === dateString;
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Win': return 'bg-green-500';
            case 'Loss': return 'bg-red-500';
            case 'In progress': return 'bg-blue-500';
            case 'Quotation': return 'bg-amber-500';
            case 'Survey': return 'bg-purple-500';
            default: return 'bg-gray-400';
        }
    };

    // Format month name
    const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // Days of week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate calendar days
    const calendarDays = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push({ day: null, date: null });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        calendarDays.push({ day, date });
    }

    const today = new Date();
    const isToday = (date) => {
        if (!date) return false;
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const selectedDateProjects = selectedDate ? getProjectsForDate(selectedDate) : [];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevMonth}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white min-w-[180px] text-center">
                        {monthName}
                    </h2>
                    <button
                        onClick={goToNextMonth}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={goToToday}
                    className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                    Today
                </button>
            </div>

            <div className="flex">
                {/* Calendar Grid */}
                <div className="flex-1 p-4">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {daysOfWeek.map(day => (
                            <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((item, index) => {
                            const projectsForDay = item.date ? getProjectsForDate(item.date) : [];
                            const hasProjects = projectsForDay.length > 0;

                            return (
                                <motion.div
                                    key={index}
                                    whileHover={item.day ? { scale: 1.05 } : {}}
                                    onClick={() => item.date && setSelectedDate(item.date)}
                                    className={`
                    min-h-[80px] p-1 rounded-lg border cursor-pointer transition-colors
                    ${item.day ? 'hover:border-blue-300 dark:hover:border-blue-500 border-gray-100 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-900/50 cursor-default border-transparent'}
                    ${isToday(item.date) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                    ${isSelected(item.date) ? 'ring-2 ring-blue-500' : ''}
                  `}
                                >
                                    {item.day && (
                                        <>
                                            <div className={`text-sm font-medium mb-1 ${isToday(item.date) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {item.day}
                                            </div>
                                            <div className="space-y-0.5">
                                                {projectsForDay.slice(0, 3).map(project => (
                                                    <div
                                                        key={project.id}
                                                        className={`${getStatusColor(project.tenderStatus)} text-[10px] text-white px-1 py-0.5 rounded truncate`}
                                                        title={project.name}
                                                    >
                                                        {project.name}
                                                    </div>
                                                ))}
                                                {projectsForDay.length > 3 && (
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                        +{projectsForDay.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Sidebar */}
                <AnimatePresence>
                    {selectedDate && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
                        >
                            <div className="p-4 w-[280px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-800 dark:text-white">
                                        {selectedDate.toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {selectedDateProjects.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500">No projects due on this date</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDateProjects.map(project => (
                                            <div
                                                key={project.id}
                                                onClick={() => onNavigateToProject?.(project.id)}
                                                className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${getStatusColor(project.tenderStatus)}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{project.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{project.tenderStatus}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
                {[
                    { status: 'Win', color: 'bg-green-500' },
                    { status: 'In Progress', color: 'bg-blue-500' },
                    { status: 'Quotation', color: 'bg-amber-500' },
                    { status: 'Survey', color: 'bg-purple-500' },
                    { status: 'Loss', color: 'bg-red-500' },
                ].map(item => (
                    <div key={item.status} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded ${item.color}`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{item.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CalendarView;
