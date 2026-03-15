import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const PostCard = ({ post }) => {
  return (
    <article className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        {post.category && (
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {post.category.name}
          </span>
        )}
        <span className="text-gray-500 text-sm">
          {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : 'Draft'}
        </span>
      </div>
      <Link to={`/posts/${post.slug}`}>
        <h2 className="text-2xl font-bold mb-2 hover:text-blue-600 transition-colors">{post.title}</h2>
      </Link>
      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-900">By {post.authorName}</span>
        <div className="flex gap-2">
          {post.tags.map(tag => (
            <span key={tag.id} className="text-gray-400 text-sm">#{tag.name}</span>
          ))}
        </div>
      </div>
    </article>
  );
};

export default PostCard;
