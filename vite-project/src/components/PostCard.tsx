import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, Send, UserIcon, X, Link, Users } from 'lucide-react';
import { Post, Comment as CommentType } from '../types';
import { likePost, unlikePost, addComment, sharePost, listenForComments } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase/config';
import { ref, get, push, set, serverTimestamp } from 'firebase/database';
import Comment from './Comment';
import moment from 'moment';

interface PostCardProps {
  post: Post;
}

interface ShareTarget {
  id: string;
  name: string;
  type: 'connection' | 'group';
  profilePic?: string;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { userProfile, currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [connections, setConnections] = useState<ShareTarget[]>([]);
  const [groups, setGroups] = useState<ShareTarget[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

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

  // Fetch connections and groups when share modal opens
  useEffect(() => {
    if (showShareModal && currentUser) {
      // Generate share URL based on post ID
      setShareUrl(`${window.location.origin}/post/${post.id}`);
      
      // Fetch user's connections
      const fetchConnections = async () => {
        try {
          const connectionsRef = ref(database, `users/${currentUser.uid}/connections`);
          const snapshot = await get(connectionsRef);
          
          if (snapshot.exists()) {
            const connectionsData = snapshot.val();
            const connectionsList = Object.entries(connectionsData).map(([id, data]: [string, any]) => ({
              id,
              name: data.name,
              profilePic: data.profilePic,
              type: 'connection' as const
            }));
            setConnections(connectionsList);
          }
        } catch (error) {
          console.error('Error fetching connections:', error);
        }
      };
      
      // Fetch user's groups
      const fetchGroups = async () => {
        try {
          const groupsRef = ref(database, `users/${currentUser.uid}/groups`);
          const snapshot = await get(groupsRef);
          
          if (snapshot.exists()) {
            const groupsData = snapshot.val();
            const groupsList = Object.entries(groupsData).map(([id, data]: [string, any]) => ({
              id,
              name: data.name,
              type: 'group' as const
            }));
            setGroups(groupsList);
          }
        } catch (error) {
          console.error('Error fetching groups:', error);
        }
      };
      
      fetchConnections();
      fetchGroups();
    }
  }, [showShareModal, currentUser, post.id]);

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

  const handleShare = () => {
    setShowShareModal(true);
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

  const toggleTargetSelection = (id: string) => {
    if (selectedTargets.includes(id)) {
      setSelectedTargets(selectedTargets.filter(targetId => targetId !== id));
    } else {
      setSelectedTargets([...selectedTargets, id]);
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setShowCopiedMessage(true);
    setTimeout(() => {
      setShowCopiedMessage(false);
    }, 2000);
  };

  const submitShare = async () => {
    if (!currentUser || selectedTargets.length === 0) return;
    
    try {
      // Update post share count
      const newShares = await sharePost(post.id, currentUser.uid);
      setSharesCount(newShares);
      
      // Share post with selected connections and groups
      const sharesRef = ref(database, 'shares');
      const newShareRef = push(sharesRef);
      
      await set(newShareRef, {
        postId: post.id,
        sharedBy: currentUser.uid,
        sharedWith: selectedTargets,
        message: shareMessage,
        timestamp: serverTimestamp()
      });
      
      // Send notifications to selected targets
      for (const targetId of selectedTargets) {
        const target = [...connections, ...groups].find(t => t.id === targetId);
        
        if (target) {
          const notificationsRef = ref(
            database, 
            target.type === 'connection' 
              ? `users/${targetId}/notifications` 
              : `groups/${targetId}/notifications`
          );
          
          const newNotificationRef = push(notificationsRef);
          await set(newNotificationRef, {
            type: 'share',
            from: {
              uid: currentUser.uid,
              name: userProfile?.displayName || 'A user',
              profilePic: userProfile?.profilePic || ''
            },
            postId: post.id,
            message: shareMessage,
            read: false,
            timestamp: serverTimestamp()
          });
        }
      }
      
      // Close the modal and reset state
      setShowShareModal(false);
      setSelectedTargets([]);
      setShareMessage('');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden transition-all duration-200 hover:shadow-xl">
      <div className="p-6">
        <div className="flex items-center mb-4">
          {post.author.profilePic ? (
            <img 
              src={post.author.profilePic} 
              alt={post.author.name} 
              className="h-10 w-10 rounded-full mb-2 object-cover" 
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
              <UserIcon className="h-5 w-5 text-indigo-500" />
            </div>
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Share this post</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Copy URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Post URL</label>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 bg-gray-50"
                />
                <button
                  onClick={copyShareUrl}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-r-md hover:bg-indigo-700"
                >
                  <Link className="h-5 w-5" />
                </button>
              </div>
              {showCopiedMessage && (
                <p className="text-green-600 text-sm mt-1">URL copied to clipboard!</p>
              )}
            </div>

            {/* Share message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add a message (optional)</label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                placeholder="Say something about this post..."
              />
            </div>

            {/* Share with connections */}
            {connections.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                  <UserIcon className="h-5 w-5 mr-1.5" />
                  Share with connections
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {connections.map(connection => (
                    <div
                      key={connection.id}
                      onClick={() => toggleTargetSelection(connection.id)}
                      className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-indigo-50 ${
                        selectedTargets.includes(connection.id) ? 'bg-indigo-100' : ''
                      }`}
                    >
                      {connection.profilePic ? (
                        <img
                          src={connection.profilePic}
                          alt={connection.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {connection.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium">{connection.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share with groups */}
            {groups.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                  <Users className="h-5 w-5 mr-1.5" />
                  Share with groups
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => toggleTargetSelection(group.id)}
                      className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-indigo-50 ${
                        selectedTargets.includes(group.id) ? 'bg-indigo-100' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{group.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={submitShare}
              disabled={selectedTargets.length === 0}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;