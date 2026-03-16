import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import RichTextEditor from '../components/RichTextEditor';

const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('{}');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  // Custom tag array for UI
  const [tagArray, setTagArray] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post-edit', id],
    queryFn: async () => {
      const response = await api.get(`/posts/edit/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '{}');
      setExcerpt(post.excerpt || '');
      setCategoryId(post.category?.id || '');
      setTagArray(post.tags?.map(t => t.name) || []);
    }
  }, [post]);

  const saveMutation = useMutation({
    mutationFn: async ({ postData, publish }) => {
      const payload = { ...postData };
      let res;
      if (id) {
        res = await api.put(`/posts/${id}`, payload);
      } else {
        res = await api.post('/posts', payload);
      }
      if (publish && res.data?.id) {
        await api.patch(`/posts/${res.data.id}/publish`);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-posts']);
      navigate('/dashboard');
    },
  });

  const handleSaveDraft = (e) => {
    e?.preventDefault();
    saveMutation.mutate({
      postData: {
        title,
        content,
        excerpt: excerpt.substring(0, 300),
        categoryId: categoryId || null,
        tags: tagArray,
      },
      publish: false
    });
  };

  const handlePublish = (e) => {
    e?.preventDefault();
    saveMutation.mutate({
      postData: {
        title,
        content,
        excerpt: excerpt.substring(0, 300),
        categoryId: categoryId || null,
        tags: tagArray,
      },
      publish: true
    });
  };

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && !tagArray.includes(newTag)) {
        setTagArray([...tagArray, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTagArray(tagArray.filter(t => t !== tagToRemove));
  };

  if (id && isLoadingPost) return <div className="p-8 text-slate-500">Loading editor...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-navy text-slate-400 flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl">auto_stories</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">BlogSpace</h1>
              <p className="text-[10px] text-primary mt-0.5 uppercase tracking-[0.2em] font-black">Story Editor</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-3">Publishing Hub</p>
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-semibold">Console</span>
          </Link>
          <Link to="/editor" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all font-bold">
            <span className="material-symbols-outlined">edit_square</span>
            <span className="text-sm">Manuscript</span>
          </Link>
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-10 mb-4 px-3">Metadata</p>
          <div className="px-3 space-y-5">
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Domain Category</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-primary transition-colors appearance-none"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="" className="bg-navy">Untracked</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-navy">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Search Excerpt</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-primary transition-colors resize-none placeholder:text-slate-600" 
                  placeholder="Summary for registry..." 
                  rows="4"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                ></textarea>
              </div>
          </div>
        </nav>
        <div className="p-6 border-t border-white/5 bg-black/20">
          <button onClick={handleSaveDraft} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all font-bold">
            <span className="material-symbols-outlined">save</span>
            <span className="text-sm">Retain Draft</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <Link to="/dashboard" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
             </Link>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">{id ? 'Revision' : 'Initialization'} Mode</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePublish}
              disabled={saveMutation.isPending || !title}
              className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Deploy Story
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-white/30 dark:bg-slate-950/20">
          <div className="max-w-4xl mx-auto py-16 px-10">
             <input 
                className="w-full text-6xl font-black border-none focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-800 bg-transparent p-0 outline-none mb-10 tracking-tight leading-tight" 
                placeholder="Story title here..." 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              
              <div className="flex flex-wrap gap-2 mb-10 items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Indexing Tags:</span>
                 {tagArray.map(t => (
                    <span key={t} className="bg-primary/5 text-primary text-[10px] px-3 py-1 rounded-full font-black border border-primary/20 flex items-center gap-1 uppercase tracking-wider">
                      {t} 
                      <span className="material-symbols-outlined !text-xs cursor-pointer hover:bg-primary/10 rounded-full" onClick={() => removeTag(t)}>close</span>
                    </span>
                  ))}
                  <input 
                    className="border-none focus:ring-0 text-sm font-bold p-0 w-32 bg-transparent outline-none placeholder:text-slate-300" 
                    placeholder="Add tag + Enter" 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                  />
              </div>

              <div className="min-h-[600px] prose-editor">
                <RichTextEditor
                  value={content}
                  onChange={(json, text) => {
                    setContent(json);
                    if (!id && (!excerpt || excerpt === text.substring(0, 150))) {
                      setExcerpt(text.substring(0, 150));
                    }
                  }}
                />
              </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditorPage;
