import React, { useState, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

const STATUS_COLUMNS = ["To Do", "In Progress", "Done", "Blocked"];

function SortableMilestone({ milestone, onClick }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: milestone.id, data: { ...milestone } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
            onClick={(e) => {
                // Prevent click when dragging
                if (!isDragging) onClick(milestone);
            }}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{milestone.name}</span>
                {milestone.priority && <PriorityBadge priority={milestone.priority} />}
            </div>

            <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1 flex-wrap">
                    {milestone.tags && milestone.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] rounded-full border border-gray-100 dark:border-gray-600">
                            {tag}
                        </span>
                    ))}
                </div>
                {milestone.dueDate && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {new Date(milestone.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </div>
        </div>
    );
}

function BoardColumn({ status, milestones, onClickMilestone }) {
    const { setNodeRef } = useSortable({ id: status });

    return (
        <div className="flex-1 min-w-[280px] bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 flex flex-col h-full max-h-[calc(100vh-200px)] border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">({milestones.length})</span>
                </h3>
            </div>

            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px]">
                <SortableContext items={milestones.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    {milestones.map(milestone => (
                        <SortableMilestone
                            key={milestone.id}
                            milestone={milestone}
                            onClick={onClickMilestone}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

function BoardView({ milestones, onUpdateMilestone, onMilestoneClick }) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Enable click on items without dragging
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [activeId, setActiveId] = useState(null);

    const columns = useMemo(() => {
        const cols = {};
        STATUS_COLUMNS.forEach(status => {
            cols[status] = milestones.filter(m => (m.status || "To Do") === status);
        });
        return cols;
    }, [milestones]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeMilestone = milestones.find(m => m.id === active.id);
        const overId = over.id;

        // Find which column we dropped into
        let newStatus = overId;

        // If dropped over another item, find that item's status
        if (!STATUS_COLUMNS.includes(overId)) {
            const overMilestone = milestones.find(m => m.id === overId);
            if (overMilestone) {
                newStatus = overMilestone.status || "To Do";
            }
        }

        if (activeMilestone && activeMilestone.status !== newStatus) {
            onUpdateMilestone(activeMilestone.id, { status: newStatus });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
                {STATUS_COLUMNS.map(status => (
                    <BoardColumn
                        key={status}
                        status={status}
                        milestones={columns[status] || []}
                        onClickMilestone={onMilestoneClick}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeId ? (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-blue-200 dark:border-blue-700 rotate-2 cursor-grabbing opacity-90">
                        {(() => {
                            const m = milestones.find(m => m.id === activeId);
                            return m ? (
                                <>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
                                        {m.priority && <PriorityBadge priority={m.priority} />}
                                    </div>
                                </>
                            ) : null;
                        })()}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

export default BoardView;
