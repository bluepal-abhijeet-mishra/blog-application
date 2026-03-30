import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, Link, useBlocker } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import postService from '../api/services/postService';
import metadataService from '../api/services/metadataService';
import categoryRequestService from '../api/services/categoryRequestService';
import toast from 'react-hot-toast';
import RichTextEditor from '../components/RichTextEditor';
import ReadOnlyEditor from '../components/ReadOnlyEditor';
import ConfirmationModal from '../components/ConfirmationModal';
import { getFirstImageFromContent, normalizeCoverImageUrl } from '../utils/postMedia';
import { useAuth } from '../context/AuthContext';

const parseEditorText = (json) => {
  try {
    const doc = JSON.parse(json || '{}');
    const collect = (node) => {
      if (!node) return '';
      if (node.type === 'text') return node.text || '';
      if (!node.content?.length) return '';
      return node.content.map(collect).join(' ');
    };
    return collect(doc).replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
};

const slugifyPreview = (input) =>
  (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const MAX_TAGS_PER_STORY = 20;
const MAX_TAG_LENGTH = 50;
const MAX_VISIBLE_TAG_SUGGESTIONS = 20;

const normalizeTag = (rawTag) =>
  (rawTag || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ');

const splitRawTags = (rawTags) =>
  (rawTags || '')
    .split(',')
    .map(normalizeTag)
    .filter(Boolean);

const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canRequestCategory = user?.role === 'AUTHOR';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('{}');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagArray, setTagArray] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [editorText, setEditorText] = useState('');
  const [isExcerptManual, setIsExcerptManual] = useState(false);
  const [baselineSignature, setBaselineSignature] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCategoryRequestOpen, setIsCategoryRequestOpen] = useState(false);
  const [requestedCategoryName, setRequestedCategoryName] = useState('');
  const [requestedCategoryReason, setRequestedCategoryReason] = useState('');
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);

  const storageKey = `editor-draft-${id || 'new'}`;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        return await metadataService.getCategories();
      } catch {
        toast.error('Failed to load categories');
        return [];
      }
    },
  });

  const { data: availableTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      try {
        return await metadataService.getTags();
      } catch {
        return [];
      }
    },
  });

  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post-edit', id],
    queryFn: async () => {
      try {
        return await postService.getPostForEdit(id);
      } catch (err) {
        toast.error('Failed to load post for editing');
        throw err;
      }
    },
    enabled: !!id,
  });

  const buildPayload = useCallback(
    (tagOverride = tagArray) => ({
      title: title.trim(),
      content,
      excerpt: excerpt.trim().substring(0, 300),
      coverImageUrl: coverImageUrl.trim() || null,
      categoryId: categoryId || null,
      tags: Array.from(new Set(tagOverride.map((t) => t.trim()).filter(Boolean))),
    }),
    [title, content, excerpt, coverImageUrl, categoryId, tagArray]
  );

  const currentPayload = useMemo(() => buildPayload(), [buildPayload]);
  const currentSignature = useMemo(() => JSON.stringify(currentPayload), [currentPayload]);
  const isDirty = isReady && currentSignature !== baselineSignature;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  const words = useMemo(() => (editorText ? editorText.split(/\s+/).filter(Boolean).length : 0), [editorText]);
  const chars = editorText.length;
  const readingTime = Math.max(1, Math.ceil(words / 220));
  const titleLength = title.trim().length;
  const excerptLength = excerpt.trim().length;
  const firstContentImage = useMemo(() => getFirstImageFromContent(content), [content]);
  const normalizedCoverImage = useMemo(() => normalizeCoverImageUrl(coverImageUrl), [coverImageUrl]);
  const resolvedCoverPreview = normalizedCoverImage || firstContentImage || '/post-cover-placeholder.svg';
  const isCoverUrlInvalid = Boolean(coverImageUrl.trim()) && !normalizedCoverImage;

  const publishChecks = useMemo(() => {
    const checks = [];
    if (titleLength < 8) checks.push('Title should be at least 8 characters.');
    if (words < 30) checks.push('Content should be at least 30 words.');
    if (excerptLength < 30) checks.push('Excerpt should be at least 30 characters.');
    if (isCoverUrlInvalid) checks.push('Cover image URL is invalid. Use a valid http(s) image URL.');
    return checks;
  }, [titleLength, words, excerptLength, isCoverUrlInvalid]);

  const canPublish = publishChecks.length === 0;
  const hasSubstantialContent = titleLength > 0 || words > 0;

  const applyDraftState = useCallback((draft) => {
    setTitle(draft.title || '');
    setContent(draft.content || '{}');
    setExcerpt(draft.excerpt || '');
    setCoverImageUrl(draft.coverImageUrl || '');
    setCategoryId(draft.categoryId || '');
    setTagArray(Array.isArray(draft.tags) ? draft.tags : []);
    const draftText = parseEditorText(draft.content || '{}');
    setEditorText(draftText);
    setIsExcerptManual(Boolean(draft.isExcerptManual || draft.excerpt));
  }, []);

  useEffect(() => {
    if (id && post) {
      const serverData = {
        title: post.title || '',
        content: post.content || '{}',
        excerpt: post.excerpt || '',
        coverImageUrl: post.coverImageUrl || '',
        categoryId: post.category?.id || '',
        tags: post.tags?.map((t) => t.name) || [],
        isExcerptManual: true,
      };
      applyDraftState(serverData);
      
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Instead of blocking window.confirm, we open our modal
          setPendingDraft(parsed);
          setIsRestoreModalOpen(true);
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
      
      setBaselineSignature(
        JSON.stringify({
          title: serverData.title.trim(),
          content: serverData.content,
          excerpt: serverData.excerpt.trim().substring(0, 300),
          coverImageUrl: serverData.coverImageUrl || null,
          categoryId: serverData.categoryId || null,
          tags: Array.from(new Set(serverData.tags.map((t) => t.trim()).filter(Boolean))),
        })
      );
      setIsReady(true);
      return;
    }

    if (!id) {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setPendingDraft(parsed);
          setIsRestoreModalOpen(true);
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
      setBaselineSignature(
        JSON.stringify({
          title: '',
          content: '{}',
          excerpt: '',
          coverImageUrl: null,
          categoryId: null,
          tags: [],
        })
      );
      setIsReady(true);
    }
  }, [id, post, storageKey, applyDraftState]);

  const handleConfirmRestore = () => {
    if (pendingDraft) {
      applyDraftState(pendingDraft);
    }
    setIsRestoreModalOpen(false);
    setPendingDraft(null);
    toast.success('Draft restored successfully.');
  };

  const handleCancelRestore = () => {
    if (!id) {
      // For new posts, if they cancel, we probably want to discard the old draft
      // to avoid nagging them again.
      localStorage.removeItem(storageKey);
    }
    setIsRestoreModalOpen(false);
    setPendingDraft(null);
    toast('Draft ignored.', { icon: 'ℹ️' });
  };

  useEffect(() => {
    if (!isReady || !isDirty) return undefined;
    const timer = setTimeout(() => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...currentPayload,
          isExcerptManual,
          updatedAt: new Date().toISOString(),
        })
      );
      setLastLocalSaveAt(new Date().toISOString());
    }, 1200);
    return () => clearTimeout(timer);
  }, [isReady, isDirty, storageKey, currentPayload, isExcerptManual]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const saveMutation = useMutation({
    mutationFn: async ({ publish, tagOverride }) => {
      const payload = buildPayload(tagOverride);
      const savedPost = id ? await postService.updatePost(id, payload) : await postService.createPost(payload);
      const finalId = id || savedPost.id;
      if (publish && finalId) {
        await postService.publishPost(finalId);
      }
      return { savedPost, finalId, publish, savedSignature: JSON.stringify(payload) };
    },
    onSuccess: ({ finalId, publish, savedSignature }) => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      localStorage.removeItem(storageKey);
      setBaselineSignature(savedSignature);
      if (publish) {
        toast.success('Story published successfully.');
        navigate('/dashboard');
      } else {
        toast.success('Draft saved.');
        if (!id && finalId) {
          navigate(`/editor/${finalId}`, { replace: true });
        }
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save story.');
    },
  });

  const requestCategoryMutation = useMutation({
    mutationFn: async () => {
      return categoryRequestService.submitRequest({
        name: requestedCategoryName.trim(),
        reason: requestedCategoryReason.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success('Category request submitted for admin review.');
      setIsCategoryRequestOpen(false);
      setRequestedCategoryName('');
      setRequestedCategoryReason('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => {
      toast.error(err.response?.data || err.message || 'Failed to submit category request.');
    },
  });

  const mergeIncomingTags = useCallback((existingTags, rawTagInput) => {
    const incomingTags = splitRawTags(rawTagInput);
    if (!incomingTags.length) {
      return {
        nextTags: existingTags,
        addedCount: 0,
        hasLongTag: false,
        hitTagLimit: false,
      };
    }

    const nextTags = [...existingTags];
    let hasLongTag = false;
    let hitTagLimit = false;
    let addedCount = 0;

    incomingTags.forEach((candidate) => {
      if (candidate.length > MAX_TAG_LENGTH) {
        hasLongTag = true;
        return;
      }

      if (nextTags.some((existing) => existing.toLowerCase() === candidate.toLowerCase())) {
        return;
      }

      if (nextTags.length >= MAX_TAGS_PER_STORY) {
        hitTagLimit = true;
        return;
      }

      nextTags.push(candidate);
      addedCount += 1;
    });

    return { nextTags, addedCount, hasLongTag, hitTagLimit };
  }, []);

  const commitTagInput = useCallback((options = {}) => {
    const { silent = false } = options;
    const { nextTags, addedCount, hasLongTag, hitTagLimit } = mergeIncomingTags(tagArray, tagInput);

    if (addedCount > 0) {
      setTagArray(nextTags);
    }

    if (tagInput.trim()) {
      setTagInput('');
    }

    if (!silent && hasLongTag) {
      toast.error(`Each tag can be at most ${MAX_TAG_LENGTH} characters.`);
    }
    if (!silent && hitTagLimit) {
      toast.error(`You can add up to ${MAX_TAGS_PER_STORY} tags per story.`);
    }

    return nextTags;
  }, [mergeIncomingTags, tagArray, tagInput]);

  const handleSaveDraft = useCallback(() => {
    const finalTags = commitTagInput();
    if (!hasSubstantialContent) {
      toast.error('Add a title or content before saving.');
      return;
    }
    saveMutation.mutate({ publish: false, tagOverride: finalTags });
  }, [commitTagInput, hasSubstantialContent, saveMutation]);

  const handlePublish = useCallback(() => {
    const finalTags = commitTagInput();
    if (!canPublish) {
      toast.error(publishChecks[0]);
      return;
    }
    saveMutation.mutate({ publish: true, tagOverride: finalTags });
  }, [canPublish, commitTagInput, publishChecks, saveMutation]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSaveDraft();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && canPublish) {
        event.preventDefault();
        handlePublish();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSaveDraft, handlePublish, canPublish]);

  const addTag = useCallback((rawTag, options = {}) => {
    const { silent = false } = options;
    const { nextTags, addedCount, hasLongTag, hitTagLimit } = mergeIncomingTags(tagArray, rawTag);

    if (addedCount > 0) {
      setTagArray(nextTags);
    }
    setTagInput('');

    if (!silent && hasLongTag) {
      toast.error(`Each tag can be at most ${MAX_TAG_LENGTH} characters.`);
    }
    if (!silent && hitTagLimit) {
      toast.error(`You can add up to ${MAX_TAGS_PER_STORY} tags per story.`);
    }
  }, [mergeIncomingTags, tagArray]);

  const removeTag = (tagToRemove) => {
    setTagArray((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const allMatchingTags = useMemo(() => {
    if (!availableTags?.length) return [];
    const typed = tagInput.trim().toLowerCase();
    return availableTags
      .filter((t) => !tagArray.some((existing) => existing.toLowerCase() === t.name.toLowerCase()))
      .filter((t) => !typed || t.name.toLowerCase().includes(typed));
  }, [availableTags, tagArray, tagInput]);

  const suggestedTags = useMemo(
    () => allMatchingTags.slice(0, MAX_VISIBLE_TAG_SUGGESTIONS),
    [allMatchingTags]
  );

  const canCreateTypedTag = useMemo(() => {
    const typed = normalizeTag(tagInput);
    if (!typed) return false;
    if (typed.length > MAX_TAG_LENGTH) return false;
    if (tagArray.some((existing) => existing.toLowerCase() === typed.toLowerCase())) return false;
    if (allMatchingTags.some((existing) => existing.name.toLowerCase() === typed.toLowerCase())) return false;
    if (tagArray.length >= MAX_TAGS_PER_STORY) return false;
    return true;
  }, [allMatchingTags, tagArray, tagInput]);

  if (id && isLoadingPost) {
    return <div className="p-8 text-slate-500">Loading editor...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <aside className="w-[300px] flex-shrink-0 bg-navy text-slate-400 flex flex-col shadow-2xl z-20">
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

        <nav className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="px-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Writing Health</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Words</p>
                <p className="text-sm text-white font-black mt-1">{words}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Read</p>
                <p className="text-sm text-white font-black mt-1">{readingTime}m</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Chars</p>
                <p className="text-sm text-white font-black mt-1">{chars}</p>
              </div>
            </div>
          </div>

          <div className="px-3 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Domain Category</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-primary transition-colors appearance-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="" className="bg-navy">Untracked</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-navy">{cat.name}</option>
                ))}
              </select>
              {canRequestCategory && (
                <button
                  type="button"
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80"
                  onClick={() => {
                    setRequestedCategoryName('');
                    setRequestedCategoryReason('');
                    setIsCategoryRequestOpen(true);
                  }}
                >
                  Request new category
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Search Excerpt</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-primary transition-colors resize-none placeholder:text-slate-600"
                placeholder="Summary for registry..."
                rows="5"
                maxLength={300}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  setIsExcerptManual(true);
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <span>{excerpt.length}/300</span>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80"
                  onClick={() => {
                    setExcerpt(editorText.substring(0, 300));
                    setIsExcerptManual(false);
                  }}
                >
                  Auto from content
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cover Image URL</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                placeholder="https://cdn.example.com/post-cover.jpg"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 disabled:opacity-40"
                  disabled={!firstContentImage}
                  onClick={() => {
                    if (firstContentImage) {
                      setCoverImageUrl(firstContentImage);
                    }
                  }}
                >
                  Use first content image
                </button>
                <span>{normalizedCoverImage ? 'Valid URL' : coverImageUrl.trim() ? 'Invalid URL' : 'Optional'}</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                <img
                  src={resolvedCoverPreview}
                  alt="Cover preview"
                  className="w-full h-32 object-cover"
                  onError={(event) => {
                    event.currentTarget.src = '/post-cover-placeholder.svg';
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Slug Preview</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 break-all">
                /posts/{slugifyPreview(title) || 'your-story-slug'}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {isDirty ? 'Unsaved changes' : 'All changes saved'}
              {lastLocalSaveAt && (
                <span className="block text-[9px] mt-1 normal-case tracking-normal">
                  Local autosave: {new Date(lastLocalSaveAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20 space-y-3">
          <button
            onClick={handleSaveDraft}
            disabled={saveMutation.isPending || !hasSubstantialContent}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl text-white bg-white/10 hover:bg-white/15 transition-all font-bold disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">save</span>
            Save Draft (Ctrl/Cmd+S)
          </button>
          <button
            onClick={handlePublish}
            disabled={saveMutation.isPending || !canPublish}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl text-white bg-primary hover:bg-primary/90 transition-all font-bold disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            Publish
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{id ? 'Edit Story' : 'New Story'}</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Professional writing mode with autosave, validation, and publish checks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              Preview
            </button>
            <button
              onClick={handlePublish}
              disabled={saveMutation.isPending || !canPublish}
              className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Publish Story
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-white/30 dark:bg-slate-950/20">
          <div className="max-w-5xl mx-auto py-12 px-10">
            <input
              className="w-full text-6xl font-black border-none focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-800 bg-transparent p-0 outline-none mb-8 tracking-tight leading-tight"
              placeholder="Write a clear, specific title..."
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="mb-8">
              <div className="flex flex-wrap gap-2 items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Indexing Tags</span>
                {tagArray.map((t) => (
                  <span key={t} className="bg-primary/5 text-primary text-[10px] px-3 py-1 rounded-full font-black border border-primary/20 flex items-center gap-1 uppercase tracking-wider">
                    {t}
                    <button type="button" className="material-symbols-outlined !text-xs hover:bg-primary/10 rounded-full" onClick={() => removeTag(t)}>
                      close
                    </button>
                  </span>
                ))}
                <input
                  className="border-none focus:ring-0 text-sm font-bold p-0 min-w-[180px] bg-transparent outline-none placeholder:text-slate-300"
                  placeholder="Add tags (custom allowed) and press Enter"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onBlur={() => {
                    if (!tagInput.trim()) return;
                    addTag(tagInput, { silent: true });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                />
              </div>
              <div className="mb-2 text-[10px] font-semibold text-slate-400">
                Use Enter, comma, or Tab. You can add custom tags not listed in suggestions.
              </div>
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {canCreateTypedTag && (
                    <button
                      type="button"
                      onClick={() => addTag(tagInput)}
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                    >
                      + Create "{normalizeTag(tagInput)}"
                    </button>
                  )}
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addTag(tag.name)}
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
                    >
                      + {tag.name}
                    </button>
                  ))}
                </div>
              )}
              {suggestedTags.length === 0 && canCreateTypedTag && (
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                >
                  + Create "{normalizeTag(tagInput)}"
                </button>
              )}
              {allMatchingTags.length > MAX_VISIBLE_TAG_SUGGESTIONS && (
                <p className="mt-2 text-[10px] text-slate-400 font-semibold">
                  Showing {MAX_VISIBLE_TAG_SUGGESTIONS} suggestions. Refine your input to narrow results.
                </p>
              )}
            </div>

            {publishChecks.length > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 mb-2">Publish checklist</p>
                <div className="text-xs text-amber-700 space-y-1">
                  {publishChecks.map((issue) => (
                    <p key={issue}>- {issue}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="min-h-[600px] prose-editor">
              <RichTextEditor
                value={content}
                onChange={(json, text) => {
                  setContent(json);
                  setEditorText(text);
                  if (!isExcerptManual) {
                    setExcerpt(text.substring(0, 300));
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800 px-8 py-4 flex items-center justify-between z-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Story Preview</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 md:p-12">
              <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={resolvedCoverPreview}
                  alt={title || 'Story cover'}
                  className="w-full h-64 object-cover"
                  onError={(event) => {
                    event.currentTarget.src = '/post-cover-placeholder.svg';
                  }}
                />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-4">{title || 'Untitled Story'}</h1>
              <p className="text-slate-500 mb-8">{excerpt || 'No excerpt yet.'}</p>
              <ReadOnlyEditor content={content} />
            </div>
          </div>
        </div>
      )}

      {canRequestCategory && isCategoryRequestOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Request Category</h3>
              <button
                onClick={() => setIsCategoryRequestOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-sm text-slate-500">
                Ask admins to add a new category. Keep it specific and reusable across multiple stories.
              </p>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Category Name</label>
                <input
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Example: Cybersecurity"
                  value={requestedCategoryName}
                  onChange={(e) => setRequestedCategoryName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Why Needed (Optional)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                  rows={4}
                  placeholder="Explain how this category improves discovery and organization."
                  value={requestedCategoryReason}
                  onChange={(e) => setRequestedCategoryReason(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsCategoryRequestOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!requestedCategoryName.trim()) {
                      toast.error('Category name is required.');
                      return;
                    }
                    requestCategoryMutation.mutate();
                  }}
                  disabled={requestCategoryMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isRestoreModalOpen}
        onClose={handleCancelRestore}
        onConfirm={handleConfirmRestore}
        title="Restore Unsaved Draft?"
        message="We found an unsaved local draft for this story. Would you like to restore it and continue where you left off?"
        confirmText="Restore Draft"
        cancelText="Discard Draft"
        type="primary"
      />

      <ConfirmationModal
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.state === 'blocked' && blocker.reset()}
        onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes. Are you sure you want to leave without saving? Your changes will be lost."
        confirmText="Discard & Leave"
        cancelText="Stay Here"
        type="danger"
      />
    </div>
  );
};

export default EditorPage;
