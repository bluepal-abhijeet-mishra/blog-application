import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { getPostCoverImage } from '../utils/postMedia';

const PostCard = ({ post }) => {
  const publishDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
  const coverImage = getPostCoverImage(post);

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all duration-500 flex flex-col md:flex-row h-auto md:h-72 shadow-sm hover:shadow-2xl hover:shadow-primary/5"
    >
      {/* Image Section */}
      <Link to={`/posts/${post.slug}`} className="relative w-full md:w-2/5 h-64 md:h-full overflow-hidden shrink-0">
        <img 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
          alt={post.title} 
          src={coverImage}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = '/post-cover-placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {post.category && (
          <div className="absolute top-6 left-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            {post.category.name}
          </div>
        )}
      </Link>
      
      {/* Content Section */}
      <div className="flex-1 p-8 md:p-10 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            {format(publishDate, 'MMM dd, yyyy')}
          </span>
          <span className="size-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            5 min read
          </span>
        </div>

        <Link to={`/posts/${post.slug}`} className="block mb-4">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-[1.2] tracking-tight">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed font-medium">
          {post.excerpt || 'Explore this in-depth analysis and discover the future of professional insights within our community.'}
        </p>

        {post.tags?.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.slug}`}
                className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
        
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-6">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800">
              <img 
                className="w-full h-full object-cover" 
                alt={post.authorName} 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=10b981&color=fff&bold=true&size=80`}
              />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{post.authorName}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Expert Contributor</p>
            </div>
          </div>
          
          <Link 
            to={`/posts/${post.slug}`} 
            className="flex items-center gap-2 text-primary text-[11px] font-black uppercase tracking-widest group/btn"
          >
            Full Insight
            <span className="material-symbols-outlined text-lg group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;
