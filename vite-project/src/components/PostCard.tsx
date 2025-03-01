import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { Post, Comment as CommentType } from '../types';
import { likePost, addComment, sharePost, getComments } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import Comment from './Comment';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { currentUser, userProfile } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      const newLikes = await likePost(post.id);
      setLikesCount(newLikes);
      setLiked(true);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const handleShare = async () => {
    if (!currentUser) return;
    
    try {
      const newShares = await sharePost(post.id);
      setSharesCount(newShares);
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };
  
  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const fetchedComments = await getComments(post.id);
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    }
    
    setShowComments(!showComments);
  };
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userProfile || !commentText.trim()) return;
    
    try {
      const newComment = await addComment(
        post.id,
        currentUser.uid,
        commentText,
        userProfile.displayName,
        userProfile.photoURL || ''
      );
      
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60000) {
      return 'just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Format as date
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center mb-4">
          {post.author.photoURL ? (
            <img
              src={post.author.photoURL}
              alt={post.author.name}
              className="h-10 w-10 rounded-full mr-3"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
              <span className="text-lg font-semibold text-indigo-600">
                {post.author.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-medium">{post.author.name}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <span>{post.author.title}</span>
              <span className="mx-1">•</span>
              <span>{formatTimestamp(post.timestamp)}</span>
            </div>
          </div>
          {post.type && (
            <div className="ml-auto">
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
              </span>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-gray-800">{post.content}</p>
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span>{likesCount}</span>
          </div>
          <div className="ml-4">
            <span>{post.comments || 0} comments</span>
          </div>
          <div className="ml-4">
            <span>{sharesCount} shares</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <button
              onClick={handleLike}
              className={`flex items-center px-4 py-2 rounded-md ${
                liked ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              Like
            </button>
            <button
              onClick={handleToggleComments}
              className="flex items-center px-4 py-2 text-gray-500 hover:text-indigo-600 rounded-md"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Comment
            </button>
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 text-gray-500 hover:text-indigo-600 rounded-md"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>
      
      {showComments && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          {isLoadingComments ? (
            <div className="text-center py-4">Loading comments...</div>
          ) : (
            <>
              {comments.length > 0 ? (
                <div className="space-y-4 mb-4">
                  {comments.map((comment) => (
                    <Comment key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-gray-500">No comments yet</div>
              )}
              
              {currentUser && (
                <form onSubmit={handleAddComment} className="mt-4 flex">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    className="flex-1 rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
                    disabled={!commentText.trim()}
                  >
                    Post
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;