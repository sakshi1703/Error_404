import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { searchPosts } from '../services/postService';
import { Post } from '../types';

const Search: React.FC = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const results = await searchPosts(query);
        setPosts(results);
      } catch (error) {
        console.error('Error searching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (query) {
      fetchSearchResults();
    } else {
      setPosts([]);
      setIsLoading(false);
    }
  }, [query]);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results for "{query}"
              </h1>
              <p className="text-gray-500">
                {isLoading ? 'Searching...' : `${posts.length} results found`}
              </p>
            </div>
            
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="ml-3 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="mt-1 h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-2 text-gray-500">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;