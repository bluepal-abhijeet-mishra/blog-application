import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentService from '../api/services/commentService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const CommentLikesPopover = ({ commentId, likeCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: likes, isLoading } = useQuery({
    queryKey: ['commentLikes', commentId],
    queryFn: () => commentService.getCommentLikes(commentId),
    enabled: isOpen && likeCount > 0,
    staleTime: 30000,
  });

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="cursor-default">{likeCount || 0}</span>
      {isOpen && likeCount > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Liked by</div>
          {isLoading ? (
            <div className="flex justify-center p-2"><span className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span></div>
          ) : likes?.length > 0 ? (
            <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-500 space-y-1">
              {likes.map(u => (
                <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="size-6 rounded-full overflow-hidden shrink-0">
                    <img 
                      src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=10b981&color=fff&bold=true&size=30`}
                      className="w-full h-full object-cover"
                      alt={u.displayName}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white truncate">{u.displayName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 px-2 pb-1">Could not load users.</div>
          )}
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-slate-900 border-b border-r border-slate-800"></div>
        </div>
      )}
    </div>
  );
};

const CommentInput = ({ user, onSubmit, initialContent = '', replyTo = null, onCancel = null, isPending = false }) => {
  const [content, setContent] = useState(initialContent);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 last:mb-0 animate-in fade-in slide-in-from-top-2 duration-300">
      {replyTo && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 mb-3 rounded-xl flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">reply</span>
            Replying to <span className="text-primary">{replyTo.authorName}</span>
          </span>
          <button type="button" onClick={onCancel} className="hover:text-rose-500 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">close</span>
            Cancel
          </button>
        </div>
      )}
      <div className="flex gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
          <img 
            className="w-full h-full object-cover" 
            alt={user.displayName} 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
          />
        </div>
        <div className="flex-1">
          <textarea
            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all min-h-[100px] text-sm shadow-sm outline-none resize-none"
            placeholder={replyTo ? `Write your reply to ${replyTo.authorName}...` : "Share your thoughts on this story..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20 uppercase tracking-widest"
              disabled={isPending || !content.trim()}
            >
              {isPending ? 'Posting...' : replyTo ? 'Send Reply' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

const CommentItem = ({ comment, user, postAuthorId, onReply, onDelete, onLike, replyingToId, setReplyingToId, addCommentMutation, level = 0 }) => {
  const isReplying = replyingToId === comment.id;

  return (
    <div className={`relative ${level > 0 ? 'mt-6' : 'mt-10 first:mt-0'}`}>
      {/* Thread Line */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="absolute left-[20px] top-[50px] bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800/50 rounded-full"></div>
      )}
      
      <div className="flex gap-5">
        <div className={`${level > 0 ? 'h-9 w-9' : 'h-12 w-12'} rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-0.5 shrink-0 overflow-hidden shadow-sm transition-transform hover:scale-105`}>
          <img 
            className="w-full h-full object-cover rounded-[14px]" 
            alt={comment.authorName} 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=10b981&color=fff&bold=true`} 
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex flex-col">
              <span className={`font-black text-slate-900 dark:text-white leading-tight ${level > 0 ? 'text-sm' : 'text-base'}`}>{comment.authorName}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {(user?.role === 'ADMIN' || user?.id === comment.authorId || user?.id === postAuthorId) && (
                <button 
                  onClick={() => onDelete(comment.id)} 
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                </button>
              )}
            </div>
          </div>
          
          <div className={`text-slate-600 dark:text-slate-300 ${level > 0 ? 'text-[14px]' : 'text-[15px]'} leading-relaxed mb-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm group-hover/comment:shadow-md transition-all`}>
            {comment.content}
          </div>
          
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <button 
                onClick={() => setReplyingToId(isReplying ? null : comment.id)} 
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all px-3 py-1.5 rounded-lg ${isReplying ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/30' : 'text-primary hover:bg-primary/5'}`}
              >
                <span className="material-symbols-outlined text-base">{isReplying ? 'close' : 'chat_bubble'}</span>
                {isReplying ? 'Cancel' : 'Reply'}
              </button>

              <div className={`flex items-center gap-1 transition-all rounded-lg ${comment.likedByCurrentUser ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/30' : 'text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <button 
                  onClick={() => onLike(comment.id)} 
                  className="p-1.5 hover:scale-110 active:scale-95 transition-transform"
                >
                  <span 
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: comment.likedByCurrentUser ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                </button>
                <div className="pr-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                  <CommentLikesPopover commentId={comment.id} likeCount={comment.likeCount} />
                </div>
              </div>
            </div>
          )}

          {isReplying && (
            <div className="mt-4 mb-6">
              <CommentInput 
                user={user} 
                replyTo={comment}
                onCancel={() => setReplyingToId(null)}
                onSubmit={(content) => onReply(content, comment.id)}
                isPending={addCommentMutation.isPending}
              />
            </div>
          )}

          {/* Recursive Replies Container */}
          {comment.replies && comment.replies.length > 0 && (
            <div className={`flex flex-col ${level === 0 ? 'ml-0' : 'ml-2'}`}>
              {comment.replies.map(reply => (
                <div key={reply.id} className="pl-4 sm:pl-8 border-l-2 border-slate-50 dark:border-slate-800/50 ml-2">
                  <CommentItem 
                    comment={reply} 
                    user={user} 
                    postAuthorId={postAuthorId} 
                    onReply={onReply} 
                    onDelete={onDelete}
                    onLike={onLike}
                    replyingToId={replyingToId}
                    setReplyingToId={setReplyingToId}
                    addCommentMutation={addCommentMutation}
                    level={level + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CommentSection = ({ postId, postAuthorId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyingToId, setReplyingToId] = useState(null);
  const [size, setSize] = useState(10);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId, size],
    queryFn: async () => {
      try {
        return await commentService.getComments(postId, 0, size);
      } catch (err) {
        toast.error('Failed to load comments');
        throw err;
      }
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (newComment) => {
      return await commentService.addComment(postId, newComment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setReplyingToId(null);
      toast.success('Comment posted successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to post comment');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id) => {
      return await commentService.deleteComment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success('Comment deleted');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete comment');
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (id) => {
      return await commentService.toggleLike(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to toggle like');
    }
  });

  const handleAddComment = (content, parentId = null) => {
    addCommentMutation.mutate({
      content,
      parentId,
    });
  };

  if (isLoading) return (
    <div className="mt-12 p-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
      <p className="text-slate-500 font-bold animate-pulse">Synchronizing conversation...</p>
    </div>
  );

  return (
    <section className="mt-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <span className="material-symbols-outlined text-2xl">forum</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Community Discourse
            </h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
               {comments?.totalElements || 0} Professional Contributions
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm mb-12">
        {user ? (
          <CommentInput 
            user={user} 
            onSubmit={handleAddComment} 
            isPending={addCommentMutation.isPending && !replyingToId}
          />
        ) : (
          <div className="py-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-4">Join the conversation to share your insights.</p>
            <button className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Sign In to Reply
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {comments?.content?.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            user={user} 
            postAuthorId={postAuthorId} 
            onReply={handleAddComment}
            onDelete={(id) => deleteCommentMutation.mutate(id)}
            onLike={(id) => toggleLikeMutation.mutate(id)}
            replyingToId={replyingToId}
            setReplyingToId={setReplyingToId}
            addCommentMutation={addCommentMutation}
          />
        ))}

        {comments?.content?.length === 0 && (
          <div className="py-20 text-center">
            <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <span className="material-symbols-outlined text-4xl">history_edu</span>
            </div>
            <p className="text-slate-400 font-bold">No contributions yet. Be the first to start the discourse.</p>
          </div>
        )}
      </div>
      
      {comments?.totalElements > size && (
        <button
          onClick={() => setSize((prev) => prev + 10)}
          className="w-full mt-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm uppercase tracking-widest"
        >
          Load More Insights
        </button>
      )}
    </section>
  );
};

export default CommentSection;
