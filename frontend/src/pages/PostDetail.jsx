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

    toast.loading('Preparing your PDF...', {
      id: 'pdf-toast',
      style: { borderRadius: '12px', background: '#1e293b', color: '#fff' },
    });

    // Clone the content so we can modify it for print without affecting the page
    const clone = element.cloneNode(true);
    clone.querySelectorAll('.no-pdf').forEach((el) => el.remove());

    // Extract article body HTML from the clone
    const articleEl = clone.querySelector('article') || clone.querySelector('.prose');
    const bodyHtml = articleEl ? articleEl.innerHTML : clone.innerHTML;

    // Build a clean, self-contained print document
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow pop-ups to download PDF.', {
        id: 'pdf-toast',
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff' },
      });
      return;
    }

    const dateStr = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Draft';

    const categoryHtml = post.category ? `<span class="pdf-category">${post.category.name}</span>` : '';
    const tagsHtml = (post.tags || []).map(t => `<span class="pdf-tag">#${t.name}</span>`).join('');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${post.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #1e293b; background: #fff;
      padding: 48px 56px; line-height: 1.75;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Outfit', 'Inter', sans-serif;
      color: #0f172a; line-height: 1.25;
      margin-top: 1.5em; margin-bottom: 0.5em;
      page-break-after: avoid;
    }
    h1 { font-size: 28pt; font-weight: 800; margin-top: 0; }
    h2 { font-size: 20pt; font-weight: 700; }
    h3 { font-size: 16pt; font-weight: 700; }
    p { margin-bottom: 0.9em; font-size: 11pt; }
    img {
      max-width: 100%; height: auto; max-height: 420px;
      object-fit: contain; border-radius: 12px;
      display: block; margin: 20px auto;
      page-break-inside: avoid;
    }
    a { color: #10b981; text-decoration: none; }
    blockquote {
      border-left: 4px solid #10b981;
      padding: 12px 20px; margin: 20px 0;
      background: #f8fafc; border-radius: 0 8px 8px 0;
      font-style: italic; color: #475569;
    }
    ul, ol { padding-left: 24px; margin-bottom: 1em; }
    li { margin-bottom: 0.4em; font-size: 11pt; }
    pre, code {
      font-family: 'Consolas', 'Monaco', monospace;
      background: #f1f5f9; border-radius: 6px; font-size: 10pt;
    }
    pre { padding: 16px; margin: 16px 0; overflow-x: auto; white-space: pre-wrap; }
    code { padding: 2px 6px; }
    pre code { padding: 0; background: none; }
    .pdf-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .pdf-category {
      padding: 4px 14px; background: #ecfdf5; color: #10b981;
      font-size: 8pt; font-weight: 800; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .pdf-tag {
      padding: 3px 10px; background: #f1f5f9; color: #64748b;
      font-size: 7pt; font-weight: 700; border-radius: 6px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .pdf-meta {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 0; border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0; margin-bottom: 28px;
    }
    .pdf-avatar { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #e2e8f0; }
    .pdf-author-name { font-weight: 700; font-size: 11pt; color: #0f172a; }
    .pdf-date { font-size: 9pt; color: #94a3b8; margin-top: 2px; }
    .pdf-cover { margin-bottom: 32px; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .pdf-cover img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 0; margin: 0; }
    .pdf-body { font-size: 11pt; }
    .pdf-body img { max-height: 380px; }
    .pdf-footer {
      margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0;
      text-align: center; font-size: 8pt; color: #94a3b8;
    }
    @media print {
      body { padding: 20px 28px; }
      img { page-break-inside: avoid; }
      h1, h2, h3 { page-break-after: avoid; }
      p, li, blockquote { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="pdf-badges">${categoryHtml}${tagsHtml}</div>
  <h1>${post.title}</h1>
  <div class="pdf-meta">
    <img class="pdf-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=10b981&color=fff&size=88" alt="${post.authorName}" />
    <div>
      <div class="pdf-author-name">${post.authorName}</div>
      <div class="pdf-date">${dateStr} &middot; 5 min read</div>
    </div>
  </div>
  <div class="pdf-cover">
    <img src="${coverImage}" alt="${post.title}" onerror="this.parentElement.style.display='none'" />
  </div>
  <div class="pdf-body">${bodyHtml}</div>
  <div class="pdf-footer">Exported from BlogSpace &middot; ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</body>
</html>`);

    printWindow.document.close();

    // Wait for fonts & images, then trigger the print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        toast.success('Use "Save as PDF" in the print dialog!', {
          id: 'pdf-toast',
          style: { borderRadius: '12px', background: '#1e293b', color: '#fff' },
        });
      }, 600);
    };
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
