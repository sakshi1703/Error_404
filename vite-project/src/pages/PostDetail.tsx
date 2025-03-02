import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database } from '../firebase/config';
import { ref, get } from 'firebase/database';
import Navbar from '../components/Navbar';
import { Post } from '../types';
import PostCard from '../components/PostCard';

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('No post ID provided');
        setLoading(false);
        return;
      }

      try {
        const postRef = ref(database, `posts/${postId}`);
        const snapshot = await get(postRef);

        if (snapshot.exists()) {
          const postData = snapshot.val();
          setPost({
            id: postId,
            ...postData
          } as Post);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-700">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <button 
          onClick={handleBack}
          className="mb-6 inline-flex items-center px-4 py-2 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back
        </button>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-4 animate-pulse">
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
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-2 text-gray-500">{error}</p>
          </div>
        ) : post ? (
          <div>
            <PostCard post={post} showFullContent={true} />
            
            {/* Add comment section or other post details here */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
              {/* Implement comments here */}
              <p className="text-gray-500">Coming soon: Comments section</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">Post not found</h3>
            <p className="mt-2 text-gray-500">The post you're looking for doesn't exist.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;