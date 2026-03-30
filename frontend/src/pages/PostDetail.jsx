import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import postService from '../api/services/postService';
import userService from '../api/services/userService';
import toast from 'react-hot-toast';
import ReadOnlyEditor from '../components/ReadOnlyEditor';
import CommentSection from '../components/CommentSection';
import { format } from 'date-fns';
import { getPostCoverImage } from '../utils/postMedia';
import useBookmarkMutation from '../hooks/useBookmarkMutation';

const PostDetail = () => {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  const { data: authorProfile } = useQuery({
    queryKey: ['authorProfile', post?.authorId],
    queryFn: () => userService.getAuthorProfile(post.authorId),
    enabled: !!post?.authorId
  });

  const followMutation = useMutation({
    mutationFn: () => userService.toggleFollow(post.authorId),
    onSuccess: (isNowFollowing) => {
      queryClient.setQueryData(['authorProfile', post.authorId], old => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: isNowFollowing,
          followerCount: isNowFollowing ? old.followerCount + 1 : Math.max(0, old.followerCount - 1)
        };
      });
      toast.success(isNowFollowing ? `You are now following ${post.authorName}` : `Unfollowed ${post.authorName}`, {
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff' }
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Action failed');
    }
  });

  const isFollowing = authorProfile?.isFollowing || false;
  const { bookmarkMutation, handleBookmarkToggle } = useBookmarkMutation(post || {});
  
  const formatCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!', {
        style: {
          borderRadius: '12px',
          background: '#1e293b',
          color: '#fff',
        },
      });
    });
  };

  const handleFollow = () => {
    if (!authorProfile) return;
    followMutation.mutate();
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

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

  const handleDownloadPdf = () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    // Force light mode momentarily
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
    }

    toast.loading('Analyzing layout dimensions... Generating PDF...', {
      id: 'pdf-toast',
      style: { borderRadius: '12px', background: '#1e293b', color: '#fff' }
    });

    // 1. Inject an ultra-aggressive global stylesheet to override ProseMirror's live DOM 
    //    reversions, strictly bounding the physical height of any internal images to 500px,
    //    and enforcing mathematical page break fits on text blocks.
    const styleId = 'pdf-strict-overrides';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      #pdf-content {
        width: 800px !important;
        max-width: 800px !important;
      }
      #pdf-content img {
        max-height: 500px !important;
        object-fit: contain !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #pdf-content p, #pdf-content h1, #pdf-content h2, #pdf-content h3, #pdf-content li {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;

    // 2. Give browser a momentarily slice to repaint the stylesheet
    setTimeout(() => {
      const opt = {
        margin: [20, 20, 20, 20],
        filename: `${post.slug}-export.pdf`,
        image: { type: 'jpeg', quality: 1 },
        pagebreak: { mode: 'css' },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 800,
          scrollY: 0,
          height: element.scrollHeight,
          windowHeight: element.scrollHeight,
          ignoreElements: (node) => node.classList && node.classList.contains('no-pdf')
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      import('html2pdf.js').then((html2pdf) => {
        html2pdf.default().from(element).set(opt).save().then(() => {
          // Clean up the intrusive global stylesheet
          if (styleEl && styleEl.parentNode) {
            styleEl.parentNode.removeChild(styleEl);
          }
          if (isDark) document.documentElement.classList.add('dark');
          toast.success('PDF Downloaded successfully!', { id: 'pdf-toast' });
        }).catch((err) => {
          console.error('PDF Error:', err);
          if (styleEl && styleEl.parentNode) {
            styleEl.parentNode.removeChild(styleEl);
          }
          if (isDark) document.documentElement.classList.add('dark');
          toast.error('PDF Generation Failed', { id: 'pdf-toast' });
        });
      });
    }, 150);
  };

  if (isLoading) return <div className="max-w-[740px] mx-auto px-6 py-12 text-slate-500">Loading...</div>;
  if (error) return <div className="max-w-[740px] mx-auto px-6 py-12 text-red-500">Post not found.</div>;

  const headings = extractHeadings(post.content);
  const coverImage = getPostCoverImage(post);

  return (
    <div className="flex flex-col lg:flex-row max-w-[1200px] mx-auto relative px-6">
      {/* Table of Contents Sidebar */}
      {headings.length > 0 && (
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24 h-fit pr-8 mt-40 no-pdf">
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
      <div id="pdf-content" className="w-full bg-white dark:bg-transparent px-2">
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
              <span>|</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> 5 min read</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 no-pdf">
          <button 
            onClick={handleDownloadPdf}
            className="size-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
            title="Download PDF"
          >
            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
          </button>
          <button 
            onClick={handleShare}
            className="size-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
            title="Share Post"
          >
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
          <button 
            onClick={handleBookmarkToggle}
            disabled={bookmarkMutation.isPending}
            className={`size-10 flex items-center justify-center rounded-full border transition-all active:scale-95 ${
              post.isSaved 
                ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10' 
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5'
            }`}
            title={post.isSaved ? "Remove Bookmark" : "Bookmark Post"}
          >
            <span 
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: post.isSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
          </button>
        </div>
      </div>

      <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl shadow-primary/5 border border-slate-100 dark:border-slate-800">
        <img 
          className="w-full h-auto max-h-[500px] object-cover" 
          alt={post.title}
          src={coverImage}
          onError={(event) => {
            event.currentTarget.src = '/post-cover-placeholder.svg';
          }}
        />
      </div>

      <article className="prose prose-lg md:prose-xl max-w-none prose-slate dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-strong:text-slate-900 dark:prose-strong:text-white">
        <ReadOnlyEditor content={post.content} />
      </article>
      </div>

      <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800 no-pdf">
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
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
              {authorProfile?.bio || "Dedicated to exploring the intersections of technology and human creativity. Founder of the BlogSpace community."}
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              <button 
                onClick={handleFollow}
                className={`px-6 py-2 font-bold rounded-xl transition-all shadow-lg ${
                  isFollowing 
                    ? 'bg-transparent border-2 border-primary text-primary hover:bg-primary/5 shadow-none' 
                    : 'bg-primary border-2 border-primary text-white hover:bg-primary/90 shadow-primary/20'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button 
                onClick={handleProfileClick}
                className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-20 no-pdf">
        <CommentSection postId={post.id} postAuthorId={post.authorId} />
      </div>
    </main>

      {/* Author Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 no-pdf">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer animate-fade-in"
            onClick={() => setShowProfileModal(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-bounceIn z-10 flex flex-col items-center text-center mx-4">
            
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="h-28 w-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-6 relative">
               <img 
                 className="w-full h-full object-cover" 
                 alt={post.authorName} 
                 src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=10b981&color=fff&size=200`}
               />
               <div className="absolute inset-0 rounded-full ring-2 ring-primary/20 ring-inset"></div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-4">
              <span className="material-symbols-outlined text-xs">verified</span>
              Verified Author
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
              {post.authorName}
            </h2>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              {authorProfile?.bio || "Dedicated to exploring the intersections of technology and human creativity. Founder of the BlogSpace community and expert in digital architecture."}
            </p>

            <div className="w-full grid grid-cols-2 gap-4 mb-8">
               <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                     {authorProfile ? formatCount(authorProfile.followerCount) : '...'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Followers</span>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                     {authorProfile ? formatCount(authorProfile.articleCount) : '...'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Articles</span>
               </div>
            </div>

            <button 
              onClick={() => {
                handleFollow();
              }}
              className={`w-full py-4 font-black rounded-2xl transition-all shadow-lg ${
                  isFollowing 
                    ? 'bg-transparent border-2 border-primary text-primary hover:bg-primary/5 shadow-none' 
                    : 'bg-primary border-2 border-primary text-white hover:bg-primary/90 shadow-primary/20'
              }`}
            >
              {isFollowing ? 'Following ' + post.authorName : 'Follow ' + post.authorName}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PostDetail;
