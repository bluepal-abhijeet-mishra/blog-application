import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Shield, ArrowUp } from 'lucide-react';

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data;
    },
  });

  const promoteMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries(['admin-users']),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Shield className="w-8 h-8 text-red-600" /> Admin Panel
      </h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="bg-gray-50 px-6 py-3 border-b font-bold">Manage Users</h2>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users?.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4">
                  <div className="font-medium">{u.displayName}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    u.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    u.role === 'AUTHOR' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {u.role === 'READER' && (
                    <button
                      onClick={() => promoteMutation.mutate({ id: u.id, role: 'AUTHOR' })}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                    >
                      <ArrowUp className="w-4 h-4" /> Promote to Author
                    </button>
                  )}
                  {u.role === 'AUTHOR' && (
                    <button
                      onClick={() => promoteMutation.mutate({ id: u.id, role: 'ADMIN' })}
                      className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-auto"
                    >
                      <ArrowUp className="w-4 h-4" /> Promote to Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
