// Currency formatter
export function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === 0) {
        return "Rp 0";
    }
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
}

// Date formatter
export function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Short date formatter
export function formatDateShort(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Calculate days until due date
export function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// Check if overdue
export function isOverdue(dueDate) {
    if (!dueDate) return false;
    const days = getDaysUntilDue(dueDate);
    return days !== null && days < 0;
}

// Get due date display text
export function getDueDateDisplay(dueDate) {
    if (!dueDate) return "N/A";

    const days = getDaysUntilDue(dueDate);

    if (days === null) return "N/A";
    if (days < 0) return `${Math.abs(days)} hari lewat`;
    if (days === 0) return "Hari ini";
    if (days === 1) return "Besok";
    if (days <= 7) return `${days} hari lagi`;
    if (days <= 30) return `${days} hari`;

    return formatDateShort(dueDate);
}

// Get tender status style
export function getTenderStatusStyle(status) {
    const styles = {
        "In progress": {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-300",
            icon: "🔄"
        },
        "Need update": {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-300",
            icon: "⚠️"
        },
        "Win": {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-300",
            icon: "✓"
        },
        "Loss": {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-300",
            icon: "✗"
        }
    };

    return styles[status] || styles["In progress"];
}

// Get all tender status options
export function getTenderStatusOptions() {
    return ["In progress", "Need update", "Win", "Loss"];
}
