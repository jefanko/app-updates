import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GaugeBar from './GaugeBar';
import EditableText from './EditableText';
import ProjectDetailsModal from './ProjectDetailsModal';
import MilestoneDetailModal from './MilestoneDetailModal';
import BoardView from './BoardView';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import TenderExpenseSection from './TenderExpenseSection';
import { calculateProgress, calculateSubProgress } from '../utils/helpers';
import {
  formatCurrency,
  formatDate,
  getDueDateDisplay,
  isOverdue,
  getTenderStatusStyle
} from '../utils/formatters';
import { canEditProject } from '../config/admin';
import CommentSection from './CommentSection';


function ProjectDetailPage({
  project,
  onGoHome,
  onBackToClients,
  onAddMilestone,
  onToggleMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onAddSubMilestone,
  onToggleSubMilestone,
  onUpdateSubMilestone,
  onDeleteSubMilestone,
  onUpdateProject,
  onUpdateProjectDetails,
  isLoggedIn,
  currentUser,
  comments = [],
  onAddComment,
  onDeleteComment
}) {
  const [newMilestone, setNewMilestone] = useState("");
  const [newSubMilestones, setNewSubMilestones] = useState({});
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  // Permission check: Owner OR Admin (god-mode) can edit
  const canEdit = isLoggedIn && canEditProject(project, currentUser);

  // Milestone Modal State
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  const handleOpenMilestoneModal = (milestone) => {
    setSelectedMilestone(milestone);
    setIsMilestoneModalOpen(true);
  };

  const { completed, total, percentage } = calculateProgress(project.milestones);
  const statusStyle = getTenderStatusStyle(project.tenderStatus);
  const dueDateText = getDueDateDisplay(project.dueDate);
  const overdue = isOverdue(project.dueDate);

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.trim() || !isLoggedIn) return;
    try {
      await onAddMilestone(project.id, newMilestone);
      setNewMilestone("");
    } catch (error) {
      console.error("Gagal menambah milestone: ", error);
    }
  };

  const handleToggle = async (milestoneId) => {
    if (!isLoggedIn) return;
    try {
      await onToggleMilestone(project.id, milestoneId);
    } catch (error) {
      console.error("Gagal update milestone: ", error);
    }
  };

  const handleUpdateMilestoneName = async (milestoneId, newName) => {
    if (!isLoggedIn) return;
    try {
      await onUpdateMilestone(project.id, milestoneId, newName);
    } catch (error) {
      console.error("Gagal update milestone: ", error);
    }
  };

  const handleUpdateProjectName = async (newName) => {
    if (!isLoggedIn) return;
    try {
      await onUpdateProject(project.id, newName);
    } catch (error) {
      console.error("Gagal update project: ", error);
    }
  };

  const handleSubmitSubMilestone = async (e, milestoneId) => {
    e.preventDefault();
    const text = newSubMilestones[milestoneId];
    if (!text?.trim() || !isLoggedIn) return;
    try {
      await onAddSubMilestone(project.id, milestoneId, text);
      setNewSubMilestones({ ...newSubMilestones, [milestoneId]: "" });
    } catch (error) {
      console.error("Gagal menambah sub-milestone: ", error);
    }
  };

  const handleToggleSubMilestone = async (milestoneId, subMilestoneId) => {
    if (!isLoggedIn) return;
    try {
      await onToggleSubMilestone(project.id, milestoneId, subMilestoneId);
    } catch (error) {
      console.error("Gagal update sub-milestone: ", error);
    }
  };

  const handleUpdateSubMilestoneName = async (milestoneId, subMilestoneId, newName) => {
    if (!isLoggedIn) return;
    try {
      await onUpdateSubMilestone(project.id, milestoneId, subMilestoneId, newName);
    } catch (error) {
      console.error("Gagal update sub-milestone: ", error);
    }
  };

  const toggleExpanded = (milestoneId) => {
    setExpandedMilestones({
      ...expandedMilestones,
      [milestoneId]: !expandedMilestones[milestoneId]
    });
  };

  const isMilestoneCompleted = (milestone) => {
    if (milestone.subMilestones && milestone.subMilestones.length > 0) {
      return milestone.subMilestones.every(sub => sub.completed);
    }
    return milestone.completed;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-8 pt-20 md:px-6">
      <div className="flex gap-3 mb-6">
        <button
          onClick={onGoHome}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Projects
        </button>
        <span className="text-gray-400 dark:text-gray-600">•</span>
        <button
          onClick={onBackToClients}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
        >
          Clients
        </button>
      </div>

      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        {/* Project Name & Location with Edit Button */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <EditableText
                value={project.name}
                onSave={handleUpdateProjectName}
                disabled={!canEdit}
                className="text-2xl font-bold text-gray-900 dark:text-white"
                placeholder="Project Name"
              />
            </div>
            {project.location && (
              <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1 text-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{project.location}</span>
              </div>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => setIsDetailsModalOpen(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Details
            </button>
          )}
        </div>

        {/* BAST Number - INA Only */}
        {project.org === 'INA' && project.bastNumber && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-green-700 dark:text-green-300">No. BAST</span>
            </div>
            <div className="mt-1 font-semibold text-green-800 dark:text-green-200">{project.bastNumber}</div>
          </div>
        )}

        {/* Info Cards Grid */}
        {(project.quotationNumber || project.quotationPrice > 0 || project.dueDate) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Quotation Info */}
            {(project.quotationNumber || project.quotationPrice > 0) && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quotation</div>
                {project.quotationNumber && (
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{project.quotationNumber}</div>
                )}
                {project.quotationPrice > 0 && (
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">{formatCurrency(project.quotationPrice)}</div>
                )}
              </div>
            )}

            {/* Due Date */}
            {project.dueDate && (
              <div className={`p-3 rounded-lg ${overdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</div>
                <div className={`font-semibold text-sm ${overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatDate(project.dueDate)}
                </div>
                <div className={`text-xs ${overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {overdue && '⚠️ '}{dueDateText}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</div>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                  <span>{statusStyle.icon}</span>
                  <span>{project.tenderStatus || "In progress"}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PIC */}
        {project.pic && (
          <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span><strong className="font-medium text-gray-700 dark:text-gray-300">PIC:</strong> {project.pic}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Milestone Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-900 dark:text-white font-semibold">{`${completed}/${total}`}</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{`${percentage}%`}</span>
            </div>
          </div>
          <GaugeBar percentage={percentage} />
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'list'
            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          List View
        </button>
        <button
          onClick={() => setViewMode('board')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'board'
            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
          Board View
        </button>
      </div>

      {viewMode === 'board' ? (
        <BoardView
          milestones={project.milestones}
          onUpdateMilestone={(id, updates) => onUpdateMilestone(project.id, id, updates)}
          onMilestoneClick={handleOpenMilestoneModal}
        />
      ) : (
        <>
          {canEdit && (
            <form onSubmit={handleSubmitMilestone} className="mb-6 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="+ Tambah milestone baru..."
                className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 whitespace-nowrap"
                disabled={!newMilestone.trim()}
              >
                Tambah
              </button>
            </form>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {project.milestones.length === 0 && (
                  <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Belum ada milestone.
                  </motion.li>
                )}
                {project.milestones.map((milestone) => {
                  const hasSubMilestones = milestone.subMilestones && milestone.subMilestones.length > 0;
                  const isExpanded = expandedMilestones[milestone.id];
                  const isCompleted = isMilestoneCompleted(milestone);
                  const subProgress = hasSubMilestones ? calculateSubProgress(milestone.subMilestones) : null;

                  return (
                    <motion.li
                      key={milestone.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className={`${isCompleted ? 'bg-gray-50 dark:bg-gray-700/50' : ''} ${!canEdit ? 'select-none' : ''}`}
                    >
                      {/* Parent Milestone */}
                      <div className="p-4 flex items-center gap-4">
                        {/* Expand/Collapse Button - Always show for owners */}
                        {canEdit ? (
                          <button
                            onClick={() => toggleExpanded(milestone.id)}
                            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition text-gray-500 dark:text-gray-400"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : hasSubMilestones ? (
                          <button
                            onClick={() => toggleExpanded(milestone.id)}
                            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition text-gray-500 dark:text-gray-400"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : (
                          <div className="w-7 flex-shrink-0"></div>
                        )}

                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => handleToggle(milestone.id)}
                          className="h-5 w-5 rounded text-blue-600 border-gray-300 dark:border-gray-500"
                          id={`milestone-${milestone.id}`}
                          disabled={!canEdit || hasSubMilestones}
                          style={{ cursor: (canEdit && !hasSubMilestones) ? 'pointer' : 'not-allowed' }}
                        />

                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {/* Date prefix */}
                            {milestone.createdAt && (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                {new Date(milestone.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }).replace(/\./g, '/')} -
                              </span>
                            )}
                            <EditableText
                              value={milestone.name}
                              onSave={(newName) => handleUpdateMilestoneName(milestone.id, newName)}
                              disabled={!canEdit}
                              className={`text-gray-800 dark:text-gray-100 break-words font-medium ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}
                              placeholder="Task Name"
                              editIconClassName="w-3 h-3"
                            />
                            <PriorityBadge priority={milestone.priority} onClick={() => canEdit && handleOpenMilestoneModal(milestone)} />
                            <StatusBadge status={milestone.status} onClick={() => canEdit && handleOpenMilestoneModal(milestone)} />
                            {milestone.tags && milestone.tags.length > 0 && (
                              <div className="flex gap-1">
                                {milestone.tags.map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Description Preview */}
                          {milestone.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">
                              {milestone.description}
                            </div>
                          )}

                          {/* Sub-milestone Progress */}
                          {hasSubMilestones && subProgress && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {subProgress.completed} / {subProgress.total} sub-tasks ({subProgress.percentage}%)
                            </div>
                          )}
                        </div>

                        {/* Edit Button */}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenMilestoneModal(milestone)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            title="Edit Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}

                        {/* Delete Button */}
                        {canEdit && (
                          <button
                            onClick={() => onDeleteMilestone('milestone', { projectId: project.id, milestoneId: milestone.id, name: milestone.name })}
                            className="ml-auto p-1.5 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition flex-shrink-0"
                            aria-label="Hapus milestone"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>

                      {/* Sub-milestones Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden bg-gray-50 dark:bg-gray-800/50"
                          >
                            <div className="pl-16 pr-4 pb-4">
                              {/* Add Sub-milestone Form */}
                              {canEdit && (
                                <form onSubmit={(e) => handleSubmitSubMilestone(e, milestone.id)} className="flex gap-2 mb-3">
                                  <input
                                    type="text"
                                    value={newSubMilestones[milestone.id] || ""}
                                    onChange={(e) => setNewSubMilestones({ ...newSubMilestones, [milestone.id]: e.target.value })}
                                    placeholder="+ Tambah sub-milestone..."
                                    className="flex-grow p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                  <button
                                    type="submit"
                                    className="px-3 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50"
                                    disabled={!newSubMilestones[milestone.id]?.trim()}
                                  >
                                    Tambah
                                  </button>
                                </form>
                              )}

                              {/* Sub-milestone List */}
                              <ul className="space-y-2">
                                {milestone.subMilestones?.map((subMilestone) => (
                                  <motion.li
                                    key={subMilestone.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                                  >
                                    {/* Checkbox */}
                                    <input
                                      type="checkbox"
                                      checked={subMilestone.completed}
                                      onChange={() => handleToggleSubMilestone(milestone.id, subMilestone.id)}
                                      className="h-4 w-4 rounded text-blue-600 border-gray-300 dark:border-gray-500"
                                      disabled={!canEdit}
                                      style={{ cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                    />

                                    {/* Sub-milestone Name */}
                                    <div className="flex-grow">
                                      <EditableText
                                        value={subMilestone.name}
                                        onSave={(newName) => handleUpdateSubMilestoneName(milestone.id, subMilestone.id, newName)}
                                        disabled={!canEdit}
                                        className={`text-sm text-gray-700 dark:text-gray-200 ${subMilestone.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}
                                        placeholder="Nama Sub-milestone"
                                        editIconClassName="w-3 h-3"
                                      />
                                    </div>

                                    {/* Delete Button */}
                                    {canEdit && (
                                      <button
                                        onClick={() => onDeleteSubMilestone('submilestone', { projectId: project.id, milestoneId: milestone.id, subMilestoneId: subMilestone.id, name: subMilestone.name })}
                                        className="p-1 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition"
                                        aria-label="Hapus sub-milestone"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                    )}
                                  </motion.li>
                                ))}
                              </ul>

                              {(!milestone.subMilestones || milestone.subMilestones.length === 0) && !canEdit && (
                                <p className="text-sm text-gray-400 text-center py-2">Belum ada sub-milestone</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>
        </>
      )}

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        project={project}
        onSave={onUpdateProjectDetails}
      />

      {/* Milestone Details Modal */}
      <MilestoneDetailModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestone={selectedMilestone}
        onSave={(milestoneId, updates) => onUpdateMilestone(project.id, milestoneId, updates)}
      />



      {/* Tender Expenses Section - INA Only */}
      {project.org === 'INA' && (
        <TenderExpenseSection
          expenses={project.tenderExpenses || []}
          onUpdate={(expenses) => onUpdateProjectDetails(project.id, { tenderExpenses: expenses })}
          canEdit={canEdit}
        />
      )}

      {/* Comment Section */}
      <CommentSection
        comments={comments.filter(c => c.projectId === project.id)}
        projectId={project.id}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onAddComment={onAddComment}
        onDeleteComment={onDeleteComment}
      />
    </div>
  );
}

export default ProjectDetailPage;
