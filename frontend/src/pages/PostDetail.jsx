import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import postService from '../api/services/postService';
import toast from 'react-hot-toast';
import ReadOnlyEditor from '../components/ReadOnlyEditor';
import CommentSection from '../components/CommentSection';
import { format } from 'date-fns';

const PostDetail = () => {
  const { slug } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      try {
        return await postService.getPostBySlug(slug);
      } catch (err) {
        toast.error(err.message || 'Failed to load post');
        throw err;
      }
    },
  });

  const extractHeadings = (contentJson) => {
    if (!contentJson) return [];
    try {
      const doc = JSON.parse(contentJson);
      return doc.content
        .filter(node => node.type === 'heading')
        .map(node => {
          const text = node.content?.map(c => c.text).join('') || '';
          const id = text.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
          return { level: node.attrs.level, text, id };
        });
    } catch (e) {
      return [];
    }
  };

  if (isLoading) return <div className="max-w-[740px] mx-auto px-6 py-12 text-slate-500">Loading...</div>;
  if (error) return <div className="max-w-[740px] mx-auto px-6 py-12 text-red-500">Post not found.</div>;

  const headings = extractHeadings(post.content);

  return (
    <div className="flex flex-col lg:flex-row max-w-[1200px] mx-auto relative px-6">
      {/* Table of Contents Sidebar */}
      {headings.length > 0 && (
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24 h-fit pr-8 mt-40">
          <div className="border-l-2 border-slate-100 dark:border-slate-800 pl-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">On this Page</h3>
            <ul className="space-y-4">
              {headings.map((heading, i) => (
                <li 
                  key={i} 
                  style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                  className="group"
                >
                  <a 
                    href={`#${heading.id}`}
                    className="text-sm font-bold text-slate-500 hover:text-primary transition-colors block leading-tight"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

      <main className="flex-1 max-w-[800px] py-12 md:py-20 animate-fade-in mx-auto lg:mx-0">
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {post.category && (
          <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest shadow-sm shadow-primary/5">
            {post.category.name}
          </span>
        )}
        <div className="flex gap-2">
          {post.tags?.map(tag => (
            <span key={tag.id} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
              #{tag.name}
            </span>
          ))}
        </div>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-10 tracking-tight">
        {post.title}
      </h1>
      
      <div className="flex items-center justify-between mb-12 py-6 border-y border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden shrink-0">
            <img 
              className="w-full h-full object-cover rounded-full" 
              alt={post.authorName} 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=10b981&color=fff`}
            />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{post.authorName}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
              <span>{post.publishedAt ? format(new Date(post.publishedAt), 'MMMM dd, yyyy') : 'Draft Version'}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> 5 min read</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="size-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
          <button className="size-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined text-xl">bookmark</span>
          </button>
        </div>
      </div>

      <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl shadow-primary/5 border border-slate-100 dark:border-slate-800">
        <img 
          className="w-full h-auto max-h-[500px] object-cover" 
          alt="Hero" 
          src={`https://picsum.photos/seed/${post.id}/1200/800`}
        />
      </div>

      <article className="prose prose-lg md:prose-xl max-w-none prose-slate dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-strong:text-slate-900 dark:prose-strong:text-white">
        <ReadOnlyEditor content={post.content} />
      </article>

      <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border border-slate-100 dark:border-slate-800/50">
           <div className="h-24 w-24 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden shrink-0">
            <img 
              className="w-full h-full object-cover" 
              alt={post.authorName} 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=10b981&color=fff`}
            />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Written by {post.authorName}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">Dedicated to exploring the intersections of technology and human creativity. Founder of the BlogSpace community.</p>
            <div className="flex justify-center md:justify-start gap-4">
              <button className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Follow</button>
              <button className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Profile</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-20">
        <CommentSection postId={post.id} postAuthorId={post.authorId} />
      </div>
    </main>
    </div>
  );
};

export default PostDetail;
