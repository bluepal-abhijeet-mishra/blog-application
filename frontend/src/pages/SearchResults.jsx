import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '0');

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', q, page],
    queryFn: async () => {
      const response = await api.get('/posts/search', {
        params: { q, page, size: 10 },
      });
      return response.data;
    },
    enabled: !!q,
  });

  const handlePageChange = (newPage) => {
    setSearchParams({ q, page: newPage.toString() });
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-6 md:px-10 py-12 gap-12 bg-[#f8fafc] dark:bg-background-dark font-display min-h-screen">
      {/* Left Sidebar Filters */}
      <aside className="w-full md:w-72 flex flex-col gap-10 shrink-0">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Refine Results</h3>
          
          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-4">Sorting Protocol</p>
              <div className="flex flex-col gap-3">
                {['Relevance', 'Latest', 'Oldest'].map((sort) => (
                  <label key={sort} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                       <input type="radio" name="sort" value={sort.toLowerCase()} defaultChecked={sort === 'Relevance'} className="peer appearance-none w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 checked:border-primary transition-all" />
                       <div className="absolute w-2 h-2 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform"></div>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">{sort}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-4">Category Matrix</p>
              <div className="flex flex-col gap-3">
                {['Technology', 'Tutorials', 'UI Design', 'DevOps'].map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 checked:bg-primary checked:border-primary transition-all" />
                      <span className="material-symbols-outlined absolute text-white text-sm scale-0 peer-checked:scale-100 transition-transform select-none">check</span>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-4">Identifier Tags</p>
              <div className="flex flex-wrap gap-2">
                {['React', 'JavaScript', 'Frontend', 'Hooks', 'State'].map((tag, idx) => (
                    <span key={tag} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border cursor-pointer transition-all ${idx === 0 || idx === 3 ? 'bg-primary/10 text-primary border-primary/20 shadow-sm shadow-primary/10' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}>
                      {tag}
                    </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Results Section */}
      <div className="flex-1 min-w-0">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-3">
            <span className="h-px w-8 bg-primary"></span>
            Search Discovery
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            {isLoading ? 'Decrypting Search...' : (
               <>Found {data?.totalElements || 0} Intelligence Reports for <span className="text-primary">"{q}"</span></>
            )}
          </h1>
          {!isLoading && <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg font-medium">Results filtered from primary database content.</p>}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-6 rounded-3xl flex items-center gap-4">
             <span className="material-symbols-outlined text-rose-500">error</span>
             <p className="font-bold">Access Denied: Could not retrieve search results. Connection protocol failed.</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-8">
            {data?.content?.length > 0 ? (
              data.content.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 group transition-all hover:border-primary/30">
                <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                   <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors">search_off</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Match Found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">The search query "{q}" did not align with any stored records. Reset your query parameters.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-16 pb-12">
            <button 
              disabled={data.first}
              onClick={() => handlePageChange(page - 1)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">chevron_left</span>
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(data.totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx)}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black transition-all ${
                    page === idx 
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button 
              disabled={data.last}
              onClick={() => handlePageChange(page + 1)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
