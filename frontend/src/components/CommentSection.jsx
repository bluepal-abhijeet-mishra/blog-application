import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentService from '../api/services/commentService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const CommentSection = ({ postId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      try {
        return await commentService.getComments(postId);
      } catch (err) {
        toast.error('Failed to load comments');
        throw err;
      }
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (newComment) => {
      return await commentService.addComment(postId, newComment.content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
      setContent('');
      setReplyTo(null);
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
      queryClient.invalidateQueries(['comments', postId]);
      toast.success('Comment deleted');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete comment');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    addCommentMutation.mutate({ content, parentId: replyTo?.id });
  };

  if (isLoading) return <div className="text-slate-500">Loading comments...</div>;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
          Comments ({comments?.totalElements || 0})
        </h3>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-12">
          {replyTo && (
            <div className="bg-slate-100 dark:bg-slate-800 p-3 mb-4 rounded-xl flex justify-between items-center text-sm text-slate-700 dark:text-slate-300">
              <span>Replying to <strong className="font-bold">{replyTo.authorName}</strong></span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
            </div>
          )}
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt={user.displayName} 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
              />
            </div>
            <div className="flex-1">
              <textarea
                className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] text-sm"
                placeholder="Write a comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={addCommentMutation.isPending || !content.trim()}
                >
                  {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <p className="mb-12 text-slate-600 dark:text-slate-400">Please login to comment.</p>
      )}

      <div className="space-y-10">
        {comments?.content?.map(comment => (
          <div key={comment.id} className="relative group/comment">
            {/* Thread Line for replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="absolute left-[20px] top-[60px] bottom-[20px] w-0.5 bg-slate-100 dark:bg-slate-800/50 rounded-full"></div>
            )}
            
            <div className="flex gap-5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-0.5 shrink-0 overflow-hidden shadow-sm">
                <img 
                  className="w-full h-full object-cover rounded-[14px]" 
                  alt={comment.authorName} 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=10b981&color=fff&bold=true`} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 dark:text-white leading-tight">{comment.authorName}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(user?.role === 'ADMIN' || user?.userId === comment.authorId) && (
                      <button 
                        onClick={() => deleteCommentMutation.mutate(comment.id)} 
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                        title="Delete Comment"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  {comment.content}
                </div>
                
                {user && (
                  <button 
                    onClick={() => {
                      setReplyTo(comment);
                      window.scrollTo({ top: document.querySelector('form')?.offsetTop - 100, behavior: 'smooth' });
                    }} 
                    className="text-xs font-black text-primary hover:text-primary/80 uppercase tracking-widest flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">reply_all</span>
                    Transmit Reply
                  </button>
                )}

                {/* Replies Container */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-8 flex flex-col gap-8">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex gap-4 group/reply animate-slide-in">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 shrink-0 overflow-hidden mt-1">
                          <img 
                            className="w-full h-full object-cover rounded-[10px]" 
                            alt={reply.authorName} 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(reply.authorName)}&background=64748b&color=fff&bold=true`} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{reply.authorName}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            {(user?.role === 'ADMIN' || user?.userId === reply.authorId) && (
                              <button 
                                onClick={() => deleteCommentMutation.mutate(reply.id)} 
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                                title="Delete Reply"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            )}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl rounded-tl-none border border-slate-100/50 dark:border-slate-800/50">
                            {reply.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {comments?.totalPages > 1 && !comments?.last && (
        <button className="w-full mt-10 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Load More Comments
        </button>
      )}
    </section>
  );
};

export default CommentSection;
