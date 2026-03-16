import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const PostCard = ({ post }) => {
  return (
    <article className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group flex flex-col h-full bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50">
      <Link to={`/posts/${post.slug}`} className="block h-64 overflow-hidden shrink-0 relative m-4 rounded-[2rem]">
        <img 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          alt={post.title} 
          src={`https://picsum.photos/seed/${post.id}/800/600`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
           <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
              Read Manuscript
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
           </span>
        </div>
      </Link>
      <div className="px-8 pb-8 pt-2 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          {post.category ? (
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-[0.1em] border border-primary/20">
              {post.category.name}
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black uppercase rounded-lg tracking-[0.1em] border border-slate-200 dark:border-slate-700">
              General Archive
            </span>
          )}
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter shrink-0">{post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : 'Draft Status'}</span>
        </div>
        
        <Link to={`/posts/${post.slug}`} className="block mb-4">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-[1.2] tracking-tight">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-8 flex-1 leading-relaxed font-medium">
          {post.excerpt || 'Discover this fascinating story and dive deep into the world of ideas and intelligence.'}
        </p>
        
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl border-2 border-primary/20 p-0.5 overflow-hidden shrink-0 shadow-sm shadow-primary/10">
              <img 
                className="w-full h-full object-cover rounded-xl" 
                alt={post.authorName} 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=10b981&color=fff`}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 dark:text-slate-200 line-clamp-1">{post.authorName}</span>
              <span className="text-[9px] text-primary font-black uppercase tracking-[0.1em]">Protocol Author</span>
            </div>
          </div>
          <button className="size-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20">
            <span className="material-symbols-outlined text-xl">ios_share</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
