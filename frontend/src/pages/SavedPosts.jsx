import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import postService from '../api/services/postService';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import { motion } from 'framer-motion';
import Pagination from '../components/Pagination';

const SavedPosts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '0');

  const { data: postsData, isLoading, error } = useQuery({
    queryKey: ['savedPosts', page],
    queryFn: async () => {
      try {
        return await postService.getSavedPosts({ page, size: 6 });
      } catch (err) {
        toast.error(err.message || 'Failed to load saved posts');
        throw err;
      }
    },
  });

  const updatePage = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fcfcfd] dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm border border-primary/20">
            <span className="material-symbols-outlined text-[14px]">collections_bookmark</span>
            Your Library
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] mb-6">
            Saved <span className="text-emerald-500 italic">Posts</span>.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-lg leading-relaxed">
            Your personal collection of valuable insights, technical references, and curated knowledge.
          </p>
          <div className="h-px bg-slate-100 dark:bg-slate-800 mt-12"></div>
        </motion.div>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <div className="size-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Retrieving archives...</p>
          </div>
        ) : error ? (
          <div className="py-32 text-center text-rose-500 font-black uppercase tracking-widest text-sm">Failed to retrieve saved posts.</div>
        ) : postsData?.content?.length > 0 ? (
          <>
            <div className="space-y-16">
              {postsData.content.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            <Pagination 
              currentPage={page} 
              totalPages={postsData?.totalPages || 0} 
              onPageChange={updatePage} 
              className="mt-16"
            />
          </>
        ) : (
          <div className="py-24 md:py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 md:p-16">
            <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">bookmark_border</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Library Empty</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-10 max-w-sm mx-auto">
              You haven't saved any posts to your personal collection yet.
            </p>
            <Link to="/feed" className="inline-flex items-center gap-3 bg-slate-900 dark:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 dark:shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Explore Network
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPosts;
