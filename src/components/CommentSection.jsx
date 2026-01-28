import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAdmin } from '../config/admin';

function CommentSection({
    comments = [],
    projectId,
    currentUser,
    isLoggedIn,
    onAddComment,
    onDeleteComment
}) {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // Comment being replied to
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Group comments by parent
    const { parentComments, repliesMap } = useMemo(() => {
        const parents = comments.filter(c => !c.parentId);
        const replies = {};
        comments.filter(c => c.parentId).forEach(c => {
            if (!replies[c.parentId]) replies[c.parentId] = [];
            replies[c.parentId].push(c);
        });
        // Sort replies by date
        Object.keys(replies).forEach(key => {
            replies[key].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        return { parentComments: parents, repliesMap: replies };
    }, [comments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !isLoggedIn || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(projectId, newComment.trim(), null);
            setNewComment('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        if (!replyText.trim() || !isLoggedIn || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(projectId, replyText.trim(), parentId);
            setReplyText('');
            setReplyingTo(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canDeleteComment = (comment) => {
        if (!currentUser) return false;
        if (isAdmin(currentUser.email)) return true;
        return comment.userId === currentUser.id || comment.userEmail === currentUser.email;
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('id-ID');
    };

    // Single comment component
    const CommentItem = ({ comment, isReply = false }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 group ${isReply ? 'ml-8 border-l-2 border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10' : 'border-b border-gray-100 dark:border-gray-700 last:border-0'}`}
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                            @{comment.userName || comment.userEmail?.split('@')[0]}
                        </span>
                        {isReply && <span className="text-gray-400 dark:text-gray-500 text-xs mx-1">↩</span>}
                        <span className="text-gray-700 dark:text-gray-300">: {comment.content}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                        {!isReply && isLoggedIn && (
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                            </button>
                        )}
                    </div>
                </div>

                {canDeleteComment(comment) && (
                    <button
                        onClick={() => onDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
                        title="Delete comment"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
                <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-2 ml-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to @${comment.userName || comment.userEmail?.split('@')[0]}...`}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!replyText.trim() || isSubmitting}
                            className="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? '...' : 'Reply'}
                        </button>
                    </div>
                </form>
            )}
        </motion.div>
    );

    return (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Comments ({comments.length})
                </h3>
            </div>

            {/* Comments List with Replies */}
            <div className="max-h-96 overflow-y-auto">
                <AnimatePresence>
                    {parentComments.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                            No comments yet. Be the first to comment!
                        </div>
                    ) : (
                        parentComments.map((comment) => (
                            <div key={comment.id}>
                                <CommentItem comment={comment} />
                                {/* Replies */}
                                {repliesMap[comment.id]?.map((reply) => (
                                    <CommentItem key={reply.id} comment={reply} isReply />
                                ))}
                            </div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Add Comment Form */}
            {isLoggedIn && (
                <form onSubmit={handleSubmit} className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type your comment..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? '...' : 'Send'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default CommentSection;
