import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CreatePostForm from '../components/CreatePostForm';
import PostCard from '../components/PostCard';
import TrendingTopics from '../components/TrendingTopics';
import PeopleYouMayKnow from '../components/PeopleYouMayKnow';
import MyConnections from '../components/MyConnections';
import { getPosts } from '../services/postService';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase/config';
import { ref, onValue,  } from 'firebase/database';

const Home: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  // Fetch user's groups from Firebase Realtime Database
  const fetchGroups = async () => {
    try {
      if (!currentUser) return;
      
      const groupsRef = ref(database, 'groups');
      
      // Listen for groups data
      onValue(groupsRef, (snapshot) => {
        const groupsData: { id: string; name: string }[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          // Check if the current user is a member of this group
          if (data.members && data.members.includes(currentUser.email)) {
            groupsData.push({
              id: childSnapshot.key || '',
              name: data.name
            });
          }
        });
        
        setGroups(groupsData);
      });
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Using the postService function or implement direct database fetch here
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
      
      // Apply the current filter if one is selected
      if (selectedCategory) {
        setFilteredPosts(fetchedPosts.filter((post) => post.type === selectedCategory));
      } else {
        setFilteredPosts(fetchedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative direct implementation for fetching posts
  const fetchPostsDirectly = () => {
    setIsLoading(true);
    try {
      const postsRef = ref(database, 'posts');
      
      onValue(postsRef, (snapshot) => {
        const fetchedPosts: Post[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const post = {
            id: childSnapshot.key || '',
            ...childSnapshot.val()
          };
          
          fetchedPosts.push(post as Post);
        });
        
        setPosts(fetchedPosts);

        if (selectedCategory) {
          setFilteredPosts(fetchedPosts.filter((post) => post.type === selectedCategory));
        } else {
          setFilteredPosts(fetchedPosts);
        }
        
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error fetching posts directly:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
      return;
    }
    fetchPosts();
    
    fetchGroups();
  }, [currentUser, loading, navigate]);

  const handleFilterChange = (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      setFilteredPosts(posts.filter((post) => post.type === category));
    } else {
      setFilteredPosts(posts); 
    }
  };

  
  const handlePostCreated = async (newPost: Post) => {
    await fetchPosts(); 
  };

  return (
    <div className="min-h-screen bg-gray-100 ">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar (Sticky) */}
          <div className="hidden lg:block space-y-6 sticky top-20 h-fit ">
            <Sidebar 
              groups={groups} 
              onFilterChange={handleFilterChange} 
            />
            <div className="mt-6">
              <MyConnections />
            </div>
          </div>

          {/* Main Content (Scrollable Posts) */}
          <div className="lg:col-span-2">
            <div className="sticky top-20  p-4 z-10 ">
              <CreatePostForm onPostCreated={handlePostCreated} selectedCategory={selectedCategory} />
            </div>

            <div className="space-y-4 mt-4" style={{ maxHeight: 'calc(100vh - 16rem)', overflowY: 'auto' }}>
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
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
                  <p className="mt-2 text-gray-500">
                    {selectedCategory 
                      ? `No ${selectedCategory} posts available. Be the first to create one!` 
                      : 'Be the first to share something!'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar (Sticky) */}
          <div className="hidden lg:block sticky top-20 h-fit">
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
