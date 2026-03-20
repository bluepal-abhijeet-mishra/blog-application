import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link, useLocation, useParams } from 'react-router-dom';
import postService from '../api/services/postService';
import metadataService from '../api/services/metadataService';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import { motion } from 'framer-motion';
import Pagination from '../components/Pagination';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const location = useLocation();
  const routeTag = location.pathname.startsWith('/tags/') ? slug : null;
  const routeCategory = location.pathname.startsWith('/categories/') ? slug : null;
  const tag = routeTag || searchParams.get('tag');
  const category = routeCategory || searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '0');

  const { data: postsData, isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ['posts', tag, category, page],
    queryFn: async () => {
      try {
        return await postService.getPosts({ tag, category, page, size: 6 });
      } catch (err) {
        toast.error(err.message || 'Failed to load posts');
        throw err;
      }
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => metadataService.getCategories(),
  });

  const updatePage = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featuredPost = postsData?.content?.[0];
  const regularPosts = postsData?.content?.slice(1) || [];

  return (
    <div className="flex-1 overflow-y-auto bg-[#fcfcfd] dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20">
        
        {/* Hero Section (Only on first page without filters) */}
        {!tag && !category && page === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Live Intellectual Feed
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] mb-6">
                  The future of <br /> 
                  <span className="text-primary italic">professional</span> <br /> 
                  publishing.
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-lg leading-relaxed">
                  Join a network of high-signal contributors sharing deep insights, technical analysis, and strategic vision.
                </p>
              </div>
              <div className="hidden lg:block w-1/3">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-32 rounded-3xl bg-slate-100 dark:bg-slate-900 overflow-hidden ${i % 2 === 0 ? 'mt-8' : ''}`}>
                       <img src={`https://picsum.photos/seed/${i + 123}/400/400`} className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-500" alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Navigation */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/feed"
                className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${!category && !tag ? 'bg-slate-900 text-white shadow-xl dark:bg-primary' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary/30 hover:text-primary shadow-sm'}`}
              >
                Global Stream
              </Link>
              {(categories || []).map(cat => (
                <Link
                  key={cat.id}
                  to={`/feed?category=${cat.slug}`}
                  className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${category === cat.slug ? 'bg-primary text-white shadow-xl' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary/30 hover:text-primary shadow-sm'}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800 mt-12"></div>
          </motion.div>
        )}

        {/* Filter View Header */}
        {(tag || category || page > 0) && (
          <div className="mb-12">
            <Link to="/feed" className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest mb-4 hover:gap-3 transition-all">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Global Stream
            </Link>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {category ? `Category: ${category}` : tag ? `Tag: #${tag}` : 'More Insights'}
            </h2>
          </div>
        )}

        {/* Continuous Feed Content */}
        {isLoadingPosts ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <div className="size-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Accessing intelligence network...</p>
          </div>
        ) : postsError ? (
          <div className="py-32 text-center text-rose-500 font-black uppercase tracking-widest text-sm">Interface Sync Failed.</div>
        ) : postsData?.content?.length > 0 ? (
          <>
            <div className="space-y-16">
              {/* If on first page and no filters, show the first post as a major highlight */}
              {postsData.content.map((post, idx) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Professional Pagination */}
            <Pagination 
              currentPage={page} 
              totalPages={postsData?.totalPages || 0} 
              onPageChange={updatePage} 
              className="mt-16"
            />
          </>
        ) : (
          <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-16">
            <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Void Detected</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-10 max-w-xs mx-auto">This specific segment of the intelligence feed contains no records yet.</p>
            <Link to="/feed" className="inline-flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all">
              Reset Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
