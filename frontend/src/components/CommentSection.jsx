import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
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
      const response = await api.get(`/posts/${postId}/comments`);
      return response.data;
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (newComment) => {
      return api.post(`/posts/${postId}/comments`, newComment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
      setContent('');
      setReplyTo(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
    },
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

      <div className="space-y-8">
        {comments?.content?.map(comment => (
          <div key={comment.id} className="flex gap-4 group">
            <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0 overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt={comment.authorName} 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=random`} 
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{comment.authorName}</span>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {(user?.role === 'ADMIN' || user?.userId === comment.authorId) && (
                  <button 
                    onClick={() => deleteCommentMutation.mutate(comment.id)} 
                    className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Comment"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {comment.content}
              </p>
              
              {user && (
                <button 
                  onClick={() => setReplyTo(comment)} 
                  className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">reply</span>
                  Reply
                </button>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-6 flex flex-col gap-6 pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="flex gap-4 group/reply">
                      <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                        <img 
                          className="w-full h-full object-cover" 
                          alt={reply.authorName} 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(reply.authorName)}&background=random`} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{reply.authorName}</span>
                            <span className="text-[10px] text-slate-500">
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {(user?.role === 'ADMIN' || user?.userId === reply.authorId) && (
                            <button 
                              onClick={() => deleteCommentMutation.mutate(reply.id)} 
                              className="text-red-400 hover:text-red-500 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                              title="Delete Reply"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                          {reply.content}
                        </p>
                        {user && (
                          <button 
                            onClick={() => setReplyTo(comment)} 
                            className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">reply</span>
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
