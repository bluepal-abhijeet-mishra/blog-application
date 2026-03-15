import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Trash2, Reply } from 'lucide-react';

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

  if (isLoading) return <div>Loading comments...</div>;

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-2xl font-bold mb-6">Comments</h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="bg-gray-100 p-2 mb-2 rounded flex justify-between items-center text-sm">
              <span>Replying to <strong>{replyTo.authorName}</strong></span>
              <button onClick={() => setReplyTo(null)} className="text-gray-500">Cancel</button>
            </div>
          )}
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
          <button
            type="submit"
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            disabled={addCommentMutation.isLoading}
          >
            Post Comment
          </button>
        </form>
      ) : (
        <p className="mb-8 text-gray-600">Please login to comment.</p>
      )}

      <div className="space-y-6">
        {comments.content.map(comment => (
          <div key={comment.id} className="group">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                {comment.authorName[0]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold">{comment.authorName}</span>
                    <span className="text-gray-500 text-sm ml-2">{format(new Date(comment.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex gap-2">
                    {user && (
                      <button onClick={() => setReplyTo(comment)} className="text-gray-400 hover:text-blue-500">
                        <Reply className="w-4 h-4" />
                      </button>
                    )}
                    {(user?.role === 'ADMIN' || user?.userId === comment.authorId) && (
                      <button onClick={() => deleteCommentMutation.mutate(comment.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-gray-800">{comment.content}</p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 ml-6 border-l-2 pl-4">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400 text-xs">
                          {reply.authorName[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-sm">{reply.authorName}</span>
                              <span className="text-gray-500 text-xs ml-2">{format(new Date(reply.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                            {(user?.role === 'ADMIN' || user?.userId === reply.authorId) && (
                              <button onClick={() => deleteCommentMutation.mutate(reply.id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-800">{reply.content}</p>
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
    </div>
  );
};

export default CommentSection;
