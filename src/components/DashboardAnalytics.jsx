import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function DashboardAnalytics({ projects = [], onNavigateToProject }) {
    // Calculate statistics
    const stats = {
        total: projects.length,
        inProgress: projects.filter(p => p.tenderStatus === 'In progress').length,
        win: projects.filter(p => p.tenderStatus === 'Win').length,
        loss: projects.filter(p => p.tenderStatus === 'Loss').length,
        quotation: projects.filter(p => p.tenderStatus === 'Quotation').length,
        survey: projects.filter(p => p.tenderStatus === 'Survey').length,
    };

    // Calculate total value
    const totalValue = projects.reduce((sum, p) => sum + (parseFloat(p.quotationPrice) || 0), 0);
    const winValue = projects
        .filter(p => p.tenderStatus === 'Win')
        .reduce((sum, p) => sum + (parseFloat(p.quotationPrice) || 0), 0);

    // Pie chart data
    const pieData = [
        { name: 'Win', value: stats.win, color: '#10B981' },
        { name: 'In Progress', value: stats.inProgress, color: '#3B82F6' },
        { name: 'Quotation', value: stats.quotation, color: '#F59E0B' },
        { name: 'Survey', value: stats.survey, color: '#8B5CF6' },
        { name: 'Loss', value: stats.loss, color: '#EF4444' },
    ].filter(d => d.value > 0);

    // Upcoming deadlines (next 7 days)
    const today = new Date();
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = projects
        .filter(p => {
            if (!p.dueDate) return false;
            const dueDate = new Date(p.dueDate);
            return dueDate >= today && dueDate <= next7Days && !['Win', 'Loss'].includes(p.tenderStatus);
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    // Overdue projects
    const overdueProjects = projects
        .filter(p => {
            if (!p.dueDate) return false;
            const dueDate = new Date(p.dueDate);
            return dueDate < today && !['Win', 'Loss'].includes(p.tenderStatus);
        })
        .slice(0, 5);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
        });
    };

    const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
        <motion.div
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-2 rounded-lg ${color ? `bg-opacity-10` : 'bg-gray-100 dark:bg-gray-700'}`} style={{ backgroundColor: `${color}15` }}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Projects"
                    value={stats.total}
                    subtitle={`Value: ${formatCurrency(totalValue)}`}
                    color="#3B82F6"
                    icon={<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>}
                />
                <StatCard
                    title="Win"
                    value={stats.win}
                    subtitle={`Value: ${formatCurrency(winValue)}`}
                    color="#10B981"
                    icon={<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>}
                />
                <StatCard
                    title="In Progress"
                    value={stats.inProgress + stats.quotation + stats.survey}
                    subtitle="Active projects"
                    color="#F59E0B"
                    icon={<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>}
                />
                <StatCard
                    title="Loss"
                    value={stats.loss}
                    color="#EF4444"
                    icon={<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Project Status Distribution</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                            No data available
                        </div>
                    )}
                </div>

                {/* Deadlines */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Upcoming Deadlines
                    </h3>

                    {/* Overdue Alert */}
                    {overdueProjects.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs font-semibold text-red-600 dark:text-red-300 mb-2">⚠️ Overdue ({overdueProjects.length})</p>
                            {overdueProjects.map(project => (
                                <div
                                    key={project.id}
                                    onClick={() => onNavigateToProject?.(project.id)}
                                    className="text-xs text-red-700 dark:text-red-300 truncate cursor-pointer hover:underline"
                                >
                                    {project.name}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upcoming */}
                    <div className="space-y-2">
                        {upcomingDeadlines.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500">No upcoming deadlines</p>
                        ) : (
                            upcomingDeadlines.map(project => (
                                <div
                                    key={project.id}
                                    onClick={() => onNavigateToProject?.(project.id)}
                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                                >
                                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{project.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{formatDate(project.dueDate)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Win Rate Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Win Rate</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                            style={{ width: `${stats.total > 0 ? (stats.win / stats.total) * 100 : 0}%` }}
                        />
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {stats.total > 0 ? Math.round((stats.win / stats.total) * 100) : 0}%
                    </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {stats.win} won out of {stats.total} total projects
                </p>
            </div>
        </div>
    );
}

export default DashboardAnalytics;
