import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get('tag');
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '0');

  const { data: postsData, isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ['posts', tag, category, page],
    queryFn: async () => {
      const response = await api.get('/posts', {
        params: { tag, category, page, size: 10 },
      });
      return response.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const resp = await api.get('/categories');
      return resp.data;
    }
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const resp = await api.get('/tags');
      return resp.data;
    }
  });

  const updatePage = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
  };

  const getMaterialIcon = (categoryName) => {
    const map = {
      'Technology': 'memory',
      'Health': 'favorite',
      'Lifestyle': 'style',
      'Finance': 'account_balance',
      'Education': 'school'
    };
    return map[categoryName] || 'label';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 hidden lg:block sticky top-24 h-fit">
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Categories</h3>
          <nav className="space-y-1">
            <Link 
              to="/feed" 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${!category ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <span className="material-symbols-outlined">trending_up</span>
              <span>All Posts</span>
            </Link>
            {Array.isArray(categories) && categories.map(cat => (
              <Link 
                key={cat.id} 
                to={`/feed?category=${cat.slug}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${category === cat.slug ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined">{getMaterialIcon(cat.name)}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Trending Tags</h3>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(tags) && tags.map(t => (
              <Link 
                key={t.id} 
                to={`/feed?tag=${t.slug}`}
                className={`px-3 py-1 border text-xs font-semibold rounded-full transition-all ${tag === t.slug ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-mint/50'}`}
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tag ? `Posts tagged #${tag}` : category ? `${category} Stories` : 'Featured Stories'}
          </h2>
          <div className="flex gap-2 shrink-0">
            <button className="p-2 bg-primary/10 rounded-lg text-primary shadow-sm shadow-primary/5">
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <span className="material-symbols-outlined">view_list</span>
            </button>
          </div>
        </div>

        {isLoadingPosts ? (
          <div className="py-24 text-center">
            <div className="inline-block size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <div className="text-slate-500 font-medium">Loading stories...</div>
          </div>
        ) : postsError ? (
          <div className="py-24 text-center text-red-500 font-medium">Failed to load stories.</div>
        ) : postsData?.content?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {postsData.content.map(post => <PostCard key={post.id} post={post} />)}
            </div>

            {/* Pagination Controls */}
            {postsData.totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button 
                  onClick={() => updatePage(page - 1)}
                  disabled={postsData.first}
                  className="size-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary hover:bg-mint/50 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                
                {[...Array(postsData.totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => updatePage(i)}
                    className={`size-10 flex items-center justify-center rounded-xl font-bold transition-all ${page === i ? 'bg-primary text-white shadow-lg shadow-primary/25 border-transparent' : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary hover:border-primary hover:bg-mint/50'}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => updatePage(page + 1)}
                  disabled={postsData.last}
                  className="size-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary hover:bg-mint/50 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">article</span>
            <p className="text-slate-500">No stories found.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
