const COVER_PLACEHOLDER_PATH = '/post-cover-placeholder.svg';

const hasValidProtocol = (value) => {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const normalizeCoverImageUrl = (raw, options = {}) => {
  const { allowData = false } = options;
  const value = (raw || '').trim();
  if (!value) return null;
  if (allowData && /^data:image\//i.test(value)) return value;
  return hasValidProtocol(value) ? value : null;
};

const extractFirstImageNode = (node, options) => {
  if (!node) return null;
  if (node.type === 'image') {
    return normalizeCoverImageUrl(node.attrs?.src, options);
  }
  if (!Array.isArray(node.content)) return null;
  for (const child of node.content) {
    const url = extractFirstImageNode(child, options);
    if (url) return url;
  }
  return null;
};

export const getFirstImageFromContent = (content, options = {}) => {
  if (!content) return null;
  try {
    const doc = typeof content === 'string' ? JSON.parse(content) : content;
    return extractFirstImageNode(doc, options);
  } catch {
    return null;
  }
};

export const getPostCoverImage = (post) =>
  normalizeCoverImageUrl(post?.coverImageUrl) ||
  getFirstImageFromContent(post?.content, { allowData: true }) ||
  COVER_PLACEHOLDER_PATH;
