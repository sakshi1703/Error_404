import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, Send } from 'lucide-react';
import { Post, Comment as CommentType } from '../types';
import { likePost, unlikePost, addComment, sharePost, listenForComments } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import Comment from './Comment';
import moment from 'moment';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.comments || 0);

  useEffect(() => {
    if (showComments) {
      const unsubscribe = listenForComments(post.id, (fetchedComments) => {
        setComments(fetchedComments.reverse());
      });
      return () => unsubscribe();
    }
  }, [showComments, post.id]);

  useEffect(() => {
    if (currentUser && post.likedBy?.includes(currentUser.uid)) {
      setLiked(true);
    }
  }, [currentUser, post.likedBy]);

  const handleLike = async () => {
    if (!currentUser || liked) return;
    try {
      const newLikes = await likePost(post.id, currentUser.uid);
      setLikesCount(newLikes);
      setLiked(true);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleShare = async () => {
    if (!currentUser) return;
    try {
      const newShares = await sharePost(post.id, currentUser.uid);
      setSharesCount(newShares);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim()) return;
    
    try {
      await addComment(
        post.id,
        currentUser.uid,
        commentText,
        currentUser.displayName || 'Anonymous',
        currentUser.photoURL || ''
      );
      setCommentText('');
      setCommentCount(prev => prev + 1);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden transition-all duration-200 hover:shadow-xl">
      <div className="p-6">
        <div className="flex items-center mb-4">
        {post.author && (
          <img 
            src={post.author.photoURL || '/default-avatar.png'} 
            alt={post.author.name || "Unknown User"}
            className="h-12 w-12 rounded-full object-cover border-2 border-indigo-100"
          />
        )}


          <div className="ml-4">
            <h3 className="font-semibold text-lg text-gray-800">{post.author.name}</h3>
            <p className="text-sm text-gray-500">{post.author.title}</p>
            <span className="text-xs text-gray-400">
              {moment(post.timestamp).fromNow()}
            </span>
          </div>
        </div>

        <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

        <div className="flex items-center justify-between text-gray-600 text-sm mb-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className={`flex items-center ${liked ? 'text-indigo-600' : 'text-gray-500'}`}
            >
              <ThumbsUp className="h-5 w-5 mr-1.5" />
              <span>{likesCount}</span>
            </button>
            
            <button 
              onClick={() => setShowComments(prev => !prev)}
              className="flex items-center hover:text-indigo-600"
            >
              <MessageSquare className="h-5 w-5 mr-1.5" />
              <span>{commentCount}</span>
            </button>

            <button 
              onClick={handleShare}
              className="flex items-center hover:text-indigo-600"
            >
              <Share2 className="h-5 w-5 mr-1.5" />
              <span>{sharesCount}</span>
            </button>
          </div>
        </div>

        {showComments && (
          <div className="border-t pt-4">
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-2">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <Comment 
                    key={comment.id} 
                    comment={comment}
                    className="bg-gray-50 rounded-lg p-4 transition-colors hover:bg-gray-100"
                  />
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No comments yet. Be the first to share your thoughts!
                </div>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
