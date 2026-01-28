import React from 'react';
import { motion } from 'framer-motion';
import GaugeBar from './GaugeBar';
import EditableText from './EditableText';
import { calculateProgress } from '../utils/helpers';
import { getTenderStatusStyle, getDueDateDisplay, isOverdue, getDaysUntilDue } from '../utils/formatters';
import { canEditProject, canDeleteProject } from '../config/admin';

function ProjectCard({ project, onSelect, onAskDelete, onUpdateProject, isLoggedIn, currentUser }) {
  const { completed, total, percentage } = calculateProgress(project.milestones || []);
  const statusStyle = getTenderStatusStyle(project.tenderStatus || "In progress");
  const dueDateText = getDueDateDisplay(project.dueDate);
  const overdue = isOverdue(project.dueDate);

  // Warning logic: Due date is 2 days or less (including overdue), and project is active
  const daysUntilDue = getDaysUntilDue(project.dueDate);
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 2;
  const isActive = !['Win', 'Loss'].includes(project.tenderStatus);
  const showWarning = isActive && isUrgent;

  // Permission check: Owner OR Admin (god-mode) can edit/delete
  const canEdit = isLoggedIn && canEditProject(project, currentUser);
  const canDelete = isLoggedIn && canDeleteProject(project, currentUser);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onAskDelete('project', { id: project.id, name: project.name });
  };

  const handleSaveName = (newName) => {
    if (onUpdateProject && newName !== project.name && canEdit) {
      onUpdateProject(project.id, newName);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      onClick={(e) => {
        if (!e.target.closest('.editable-text') && !e.target.closest('button')) {
          onSelect(project.id);
        }
      }}
      className={`rounded-xl border hover:shadow-md transition-all cursor-pointer relative group p-5 ${showWarning
        ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800 hover:border-red-400 dark:hover:border-red-700'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
    >
      {canDelete && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
          aria-label="Delete project"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Project Name */}
      <div className="mb-3 editable-text pr-8" onClick={(e) => e.stopPropagation()}>
        <EditableText
          value={project.name}
          onSave={handleSaveName}
          disabled={!canEdit}
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          placeholder="Project Name"
        />
      </div>

      {/* Location */}
      {project.location && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{project.location}</span>
        </div>
      )}

      {/* Status & Due Date */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          <span>{statusStyle.icon}</span>
          <span>{project.tenderStatus || "In progress"}</span>
        </span>

        {project.dueDate && (
          <span className={`text-xs font-medium ${overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {overdue && '⚠️ '}{dueDateText}
          </span>
        )}
      </div>

      {/* PIC */}
      {project.pic && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>PIC: {project.pic}</span>
        </div>
      )}

      {/* Progress */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{`${completed}/${total}`}</span>
        </div>
        <GaugeBar percentage={percentage} />
        <div className="flex justify-between items-center mt-1">
          {project.createdAt && (
            <span className="text-xs text-gray-400">
              {new Date(project.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\./g, '/')}
            </span>
          )}
          <span className="text-lg font-bold text-blue-600">{`${percentage}%`}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default ProjectCard;
