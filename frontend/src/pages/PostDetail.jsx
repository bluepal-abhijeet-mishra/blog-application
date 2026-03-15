import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import ReadOnlyEditor from '../components/ReadOnlyEditor';
import CommentSection from '../components/CommentSection';
import { format } from 'date-fns';

const PostDetail = () => {
  const { slug } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const response = await api.get(`/posts/${slug}`);
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Post not found.</div>;

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
              {post.authorName[0]}
            </div>
            <span className="font-medium">{post.authorName}</span>
          </div>
          <span>•</span>
          <span>{post.publishedAt ? format(new Date(post.publishedAt), 'MMMM dd, yyyy') : 'Draft'}</span>
          {post.category && (
            <>
              <span>•</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-semibold">{post.category.name}</span>
            </>
          )}
        </div>
      </header>

      <div className="prose prose-lg max-w-none mb-12">
        <ReadOnlyEditor content={post.content} />
      </div>

      <div className="flex gap-2 mb-12">
        {post.tags.map(tag => (
          <span key={tag.id} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
            #{tag.name}
          </span>
        ))}
      </div>

      <CommentSection postId={post.id} />
    </article>
  );
};

export default PostDetail;
