// Admin Configuration for God-Mode Access
// Admins have full access to all projects regardless of ownership

export const ADMIN_EMAILS = [
    'kami-sama@gmail.com',
];

// Check if user is an admin (god-mode)
export const isAdmin = (userEmail) => {
    if (!userEmail) return false;
    return ADMIN_EMAILS.includes(userEmail.toLowerCase());
};

// Check if user can edit a project (owner OR admin)
export const canEditProject = (project, currentUser) => {
    if (!currentUser) return false;

    // Admin has god-mode
    if (isAdmin(currentUser.email)) return true;

    // For backward compatibility, allow edit if no createdBy exists (old data)
    if (!project.createdBy) return true;

    // Owner can edit
    return currentUser.id === project.createdBy?.id;
};

// Check if user can delete a project (owner OR admin)
export const canDeleteProject = (project, currentUser) => {
    return canEditProject(project, currentUser);
};
