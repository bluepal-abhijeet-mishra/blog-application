import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';

const Home = () => {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '0');

  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', tag, category, page],
    queryFn: async () => {
      const response = await api.get('/posts', {
        params: { tag, category, page, size: 10 },
      });
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading posts</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {tag ? `Posts tagged #${tag}` : category ? `${category} Posts` : 'Latest Posts'}
        </h1>
      </div>

      <div className="grid gap-8">
        {data.content.length > 0 ? (
          data.content.map(post => <PostCard key={post.id} post={post} />)
        ) : (
          <p>No posts found.</p>
        )}
      </div>

      {/* Basic Pagination */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          disabled={data.first}
          onClick={() => {/* update page param */}}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={data.last}
          onClick={() => {/* update page param */}}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Home;
