import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import RichTextEditor from '../components/RichTextEditor';

const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('{}');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  const { data: post } = useQuery({
    queryKey: ['post-edit', id],
    queryFn: async () => {
      const response = await api.get(`/posts/edit/${id}`); // We might need a specific endpoint for editing or use slug if we have it
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setExcerpt(post.excerpt);
      setCategoryId(post.category?.id || '');
      setTags(post.tags.map(t => t.name).join(', '));
    }
  }, [post]);

  const saveMutation = useMutation({
    mutationFn: async (postData) => {
      if (id) {
        return api.put(`/posts/${id}`, postData);
      } else {
        return api.post('/posts', postData);
      }
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t !== '');
    saveMutation.mutate({
      title,
      content,
      excerpt: excerpt.substring(0, 300),
      categoryId: categoryId || null,
      tags: tagList,
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{id ? 'Edit Post' : 'New Post'}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Title</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Category</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">Tags (comma separated)</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg"
              placeholder="javascript, react, tutorial"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Content</label>
          <RichTextEditor
            value={content}
            onChange={(json, text) => {
              setContent(json);
              if (!id) setExcerpt(text); // Auto-generate excerpt for new posts
            }}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Excerpt Preview</label>
          <textarea
            className="w-full p-2 border rounded-lg"
            rows="3"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          ></textarea>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={saveMutation.isLoading}
          >
            {id ? 'Update' : 'Save Draft'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditorPage;
