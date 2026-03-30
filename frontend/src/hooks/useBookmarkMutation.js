import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import postService from '../api/services/postService';
import { useAuth } from '../context/AuthContext';

const cancelBookmarkQueries = (queryClient, slug) =>
  Promise.all([
    queryClient.cancelQueries({ queryKey: ['post', slug] }),
    queryClient.cancelQueries({ queryKey: ['posts'] }),
    queryClient.cancelQueries({ queryKey: ['search'] }),
    queryClient.cancelQueries({ queryKey: ['savedPosts'] }),
  ]);

const restoreSnapshots = (queryClient, snapshots = []) => {
  snapshots.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

const updatePostState = (post, nextSaved) => {
  if (!post) return post;

  return {
    ...post,
    isSaved: nextSaved,
    likeCount: Math.max(0, (post.likeCount || 0) + (nextSaved ? 1 : -1)),
  };
};

const updatePostCollection = (oldData, postId, nextSaved) => {
  if (!oldData?.content) return oldData;

  return {
    ...oldData,
    content: oldData.content.map((item) =>
      item.id === postId ? updatePostState(item, nextSaved) : item
    ),
  };
};

const updateSavedPostCollection = (oldData, postId, nextSaved) => {
  if (!oldData?.content) return oldData;

  if (nextSaved) {
    return updatePostCollection(oldData, postId, true);
  }

  const content = oldData.content.filter((item) => item.id !== postId);
  if (content.length === oldData.content.length) {
    return oldData;
  }

  const pageSize = oldData.size || oldData.content.length || 1;
  const totalElements = Math.max(0, (oldData.totalElements || 0) - 1);
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pageSize);
  const currentPage = oldData.number || 0;

  return {
    ...oldData,
    content,
    totalElements,
    totalPages,
    numberOfElements: content.length,
    empty: content.length === 0,
    first: currentPage === 0,
    last: totalPages === 0 ? true : currentPage >= totalPages - 1,
  };
};

const useBookmarkMutation = (post) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const bookmarkMutation = useMutation({
    mutationFn: (nextSaved) =>
      nextSaved ? postService.addBookmark(post.id) : postService.removeBookmark(post.id),
    onMutate: async (nextSaved) => {
      await cancelBookmarkQueries(queryClient, post.slug);

      const postSnapshot = [['post', post.slug], queryClient.getQueryData(['post', post.slug])];
      const postsSnapshots = queryClient.getQueriesData({ queryKey: ['posts'] });
      const searchSnapshots = queryClient.getQueriesData({ queryKey: ['search'] });
      const savedSnapshots = queryClient.getQueriesData({ queryKey: ['savedPosts'] });

      queryClient.setQueryData(['post', post.slug], (oldData) => updatePostState(oldData, nextSaved));
      queryClient.setQueriesData(
        { queryKey: ['posts'] },
        (oldData) => updatePostCollection(oldData, post.id, nextSaved)
      );
      queryClient.setQueriesData(
        { queryKey: ['search'] },
        (oldData) => updatePostCollection(oldData, post.id, nextSaved)
      );
      queryClient.setQueriesData(
        { queryKey: ['savedPosts'] },
        (oldData) => updateSavedPostCollection(oldData, post.id, nextSaved)
      );

      return {
        snapshots: [postSnapshot, ...postsSnapshots, ...searchSnapshots, ...savedSnapshots],
      };
    },
    onSuccess: (response, nextSaved) => {
      toast.success(response?.message || (nextSaved ? 'Post added to bookmarks' : 'Post removed from bookmarks'));
    },
    onError: (error, _nextSaved, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      toast.error(error.message || 'Failed to update bookmark');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', post.slug] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    },
  });

  const handleBookmarkToggle = () => {
    if (!user) {
      toast.error('Sign in to manage bookmarks', {
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff' },
      });
      return;
    }

    bookmarkMutation.mutate(!post.isSaved);
  };

  return { bookmarkMutation, handleBookmarkToggle };
};

export default useBookmarkMutation;
