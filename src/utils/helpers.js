export function calculateProgress(milestones = []) {
  const total = milestones.length;
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  // Check if milestone is completed
  // If it has sub-milestones, it's complete only when all sub-milestones are complete
  const completed = milestones.filter(m => {
    if (m.subMilestones && m.subMilestones.length > 0) {
      return m.subMilestones.every(sub => sub.completed);
    }
    return m.completed;
  }).length;

  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

// Calculate progress for sub-milestones
export function calculateSubProgress(subMilestones = []) {
  const total = subMilestones.length;
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const completed = subMilestones.filter(sub => sub.completed).length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}