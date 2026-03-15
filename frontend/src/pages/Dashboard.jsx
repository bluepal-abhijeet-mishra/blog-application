import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { format } from 'date-fns';
import { Edit, Trash2, ExternalLink, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useQuery({
    queryKey: ['my-posts'],
    queryFn: async () => {
      const response = await api.get('/posts/my-posts');
      return response.data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id) => api.patch(`/posts/${id}/publish`),
    onSuccess: () => queryClient.invalidateQueries(['my-posts']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/posts/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['my-posts']),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Posts</h1>
        <Link to="/editor" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Create New Post
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts?.map(post => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{post.title}</div>
                  <div className="text-sm text-gray-500">{post.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  {post.status === 'DRAFT' && (
                    <button
                      onClick={() => publishMutation.mutate(post.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Publish"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <Link to={`/posts/${post.slug}`} className="text-gray-600 hover:text-gray-900 inline-block" title="View">
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                  <Link to={`/editor/${post.id}`} className="text-blue-600 hover:text-blue-900 inline-block" title="Edit">
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => { if(confirm('Are you sure?')) deleteMutation.mutate(post.id) }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
