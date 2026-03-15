import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '0');

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', q, page],
    queryFn: async () => {
      const response = await api.get('/posts/search', {
        params: { q, page, size: 10 },
      });
      return response.data;
    },
    enabled: !!q,
  });

  if (!q) return <div>Enter a search query</div>;
  if (isLoading) return <div>Searching...</div>;
  if (error) return <div>Error during search</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Search results for "{q}"</h1>
      <div className="grid gap-8">
        {data.content.length > 0 ? (
          data.content.map(post => <PostCard key={post.id} post={post} />)
        ) : (
          <p>No posts match your search.</p>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
