import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CreatePostForm from '../components/CreatePostForm';
import PostCard from '../components/PostCard';
import TrendingTopics from '../components/TrendingTopics';
import PeopleYouMayKnow from '../components/PeopleYouMayKnow';
import { getPosts } from '../services/postService';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
      return;
    }
    
    fetchPosts();
  }, [currentUser, loading, navigate]);
  
  const mockGroups = [
    { id: 'ux-design', name: 'UX Design Collective' },
    { id: 'js-enthusiasts', name: 'JavaScript Enthusiasts' },
    { id: 'startup-founders', name: 'Startup Founders' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block">
            <Sidebar groups={mockGroups} />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <CreatePostForm onPostCreated={fetchPosts} />
            
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
              <div>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                <p className="mt-2 text-gray-500">
                  Be the first to share something with the community!
                </p>
              </div>
            )}
          </div>
          
          {/* Right Sidebar */}
          <div className="hidden lg:block">
            <div className="space-y-6">
              <TrendingTopics />
              <PeopleYouMayKnow />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;