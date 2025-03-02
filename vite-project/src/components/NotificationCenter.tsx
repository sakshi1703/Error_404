import React, { useState, useEffect } from 'react';
import { Bell, X, ExternalLink, Users } from 'lucide-react';
import {  useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase/config';
import { ref, onValue, update, get } from 'firebase/database';

interface Notification {
  id: string;
  type: 'share' | 'comment' | 'like' | 'mention' | 'group';
  from: {
    uid: string;
    name: string;
    profilePic?: string;
  };
  message?: string;
  postId?: string;
  groupId?: string;
  groupName?: string;
  read: boolean;
  timestamp: number;
}

const NotificationCenter: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [notificationContent, setNotificationContent] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!currentUser) return;

    // Listen for user-specific notifications
    const userNotificationsRef = ref(database, `users/${currentUser.uid}/notifications`);
    
    const unsubscribeUser = onValue(userNotificationsRef, (snapshot) => {
      let notificationsList: Notification[] = [];
      
      if (snapshot.exists()) {
        const notificationsData = snapshot.val();
        notificationsList = Object.entries(notificationsData).map(
          ([id, data]: [string, any]) => ({
            id,
            ...data,
            timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
          })
        );
      }
      
      // Listen for group memberships to fetch group notifications
      const userGroupsRef = ref(database, `users/${currentUser.uid}/groups`);
      get(userGroupsRef).then((groupsSnapshot) => {
        if (groupsSnapshot.exists()) {
          const groups = groupsSnapshot.val();
          const groupPromises = Object.keys(groups).map(groupId => {
            const groupNotificationsRef = ref(database, `groups/${groupId}/notifications`);
            return get(groupNotificationsRef).then(groupNotifSnapshot => {
              if (groupNotifSnapshot.exists()) {
                const groupNotifs = groupNotifSnapshot.val();
                return Object.entries(groupNotifs).map(([id, data]: [string, any]) => ({
                  id,
                  ...data,
                  type: 'group',
                  groupId,
                  groupName: groups[groupId].name || 'Group',
                  timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
                }));
              }
              return [];
            });
          });
          
          Promise.all(groupPromises).then(groupNotificationArrays => {
            // Combine user and group notifications
            const allNotifications = [
              ...notificationsList,
              ...groupNotificationArrays.flat()
            ];
            
            // Sort by timestamp (newest first)
            const sortedNotifications = allNotifications.sort(
              (a, b) => b.timestamp - a.timestamp
            );
            
            setNotifications(sortedNotifications);
            
            // Count unread notifications
            const unread = sortedNotifications.filter(
              (notification) => !notification.read
            ).length;
            
            setUnreadCount(unread);
          });
        } else {
          // No groups, just use user notifications
          const sortedNotifications = notificationsList.sort(
            (a, b) => b.timestamp - a.timestamp
          );
          
          setNotifications(sortedNotifications);
          
          const unread = sortedNotifications.filter(
            (notification) => !notification.read
          ).length;
          
          setUnreadCount(unread);
        }
      });
    });
    
    return () => unsubscribeUser();
  }, [currentUser]);

  // Fetch post content when expanding a notification
  useEffect(() => {
    if (expandedNotification) {
      const notification = notifications.find(n => n.id === expandedNotification);
      if (notification && notification.postId && !notificationContent[notification.postId]) {
        const postRef = ref(database, `posts/${notification.postId}`);
        get(postRef).then(snapshot => {
          if (snapshot.exists()) {
            const postData = snapshot.val();
            setNotificationContent(prev => ({
              ...prev,
              [notification.postId as string]: postData
            }));
          }
        });
      }
    }
  }, [expandedNotification, notifications]);

  const markAsRead = async (notificationId: string, isGroupNotification = false) => {
    if (!currentUser) return;
    
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    let notificationRef;
    if (isGroupNotification && notification.groupId) {
      notificationRef = ref(
        database,
        `groups/${notification.groupId}/notifications/${notificationId}/readBy/${currentUser.uid}`
      );
      await update(notificationRef, { seen: true });
      
      // Also update the notification in our state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } else {
      notificationRef = ref(
        database,
        `users/${currentUser.uid}/notifications/${notificationId}`
      );
      await update(notificationRef, {
        read: true
      });
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    
    const updates: Record<string, any> = {};
    const groupUpdates: Record<string, Record<string, any>> = {};
    
    notifications.forEach(notification => {
      if (!notification.read) {
        if (notification.type === 'group' && notification.groupId) {
          if (!groupUpdates[notification.groupId]) {
            groupUpdates[notification.groupId] = {};
          }
          groupUpdates[notification.groupId][`notifications/${notification.id}/readBy/${currentUser.uid}`] = true;
        } else {
          updates[`users/${currentUser.uid}/notifications/${notification.id}/read`] = true;
        }
      }
    });
    
    // Apply user notification updates
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
    
    // Apply group notification updates
    for (const groupId of Object.keys(groupUpdates)) {
      await update(ref(database, `groups/${groupId}`), groupUpdates[groupId]);
    }
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read
    if (!notification.read) {
      await markAsRead(notification.id, notification.type === 'group');
    }
    
    // Toggle expanded view for notifications with messages or posts
    if (notification.message || notification.postId) {
      setExpandedNotification(expandedNotification === notification.id ? null : notification.id);
    } else if (notification.groupId && notification.type === 'group') {
      // Navigate to the group
      navigate(`/group/${notification.groupId}`);
      setShowNotifications(false);
    }
  };

  const navigateToPost = (postId: string) => {
    navigate(`/post/${postId}`);
    setShowNotifications(false);
    setExpandedNotification(null);
  };

  const navigateToGroup = (groupId: string) => {
    navigate(`/group/${groupId}`);
    setShowNotifications(false);
    setExpandedNotification(null);
  };

  const getNotificationTime = (timestamp: number) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  const getNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'share':
        return (
          <div>
            <strong>{notification.from.name}</strong> shared a post with you
          </div>
        );
      case 'comment':
        return (
          <div>
            <strong>{notification.from.name}</strong> commented on your post
          </div>
        );
      case 'like':
        return (
          <div>
            <strong>{notification.from.name}</strong> liked your post
          </div>
        );
      case 'mention':
        return (
          <div>
            <strong>{notification.from.name}</strong> mentioned you in a post
          </div>
        );
      case 'group':
        return (
          <div>
            <strong>{notification.from.name}</strong> posted in <strong>{notification.groupName}</strong>
          </div>
        );
      default:
        return (
          <div>
            <strong>{notification.from.name}</strong> interacted with your content
          </div>
        );
    }
  };

  const getProfilePicture = (notification: Notification) => {
    if (notification.from.profilePic) {
      return (
        <img
          src={notification.from.profilePic}
          alt={notification.from.name}
          className="h-10 w-10 rounded-full object-cover mr-3"
        />
      );
    } else if (notification.type === 'group') {
      return (
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          <Users className="h-5 w-5 text-blue-500" />
        </div>
      );
    } else {
      return (
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
          <span className="text-indigo-500 font-semibold">
            {notification.from.name.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 text-gray-400 hover:text-gray-500 relative"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/3">
            <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Notifications</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <div key={notification.id} className="border-b last:border-b-0">
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notification.read ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        {getProfilePicture(notification)}

                        <div className="flex-1">
                          <div className="text-sm">
                            {getNotificationContent(notification)}
                            <div className="text-xs text-gray-500 mt-1">
                              {getNotificationTime(notification.timestamp)}
                            </div>
                          </div>
                        </div>

                        {!notification.read && (
                          <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                        )}
                      </div>

                      {/* Expanded view for notifications with messages and post details */}
                      {expandedNotification === notification.id && (
                        <div className="mt-3 pl-12">
                          {notification.message && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-2 text-sm">
                              {notification.message}
                            </div>
                          )}
                          
                          {/* Show post content when available */}
                          {notification.postId && notificationContent[notification.postId] && (
                            <div className="bg-white border rounded-lg p-3 mb-2 text-sm shadow-sm">
                              <div className="font-medium mb-1">
                                {notificationContent[notification.postId].title || 'Post content'}
                              </div>
                              <div className="text-gray-600 line-clamp-3">
                                {notificationContent[notification.postId].content || ''}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex space-x-2 mt-2">
                            {notification.postId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToPost(notification.postId as string);
                                }}
                                className="flex items-center text-indigo-600 text-sm font-medium hover:text-indigo-800"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View post
                              </button>
                            )}
                            
                            {notification.type === 'group' && notification.groupId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToGroup(notification.groupId as string);
                                }}
                                className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-800"
                              >
                                <Users className="h-4 w-4 mr-1" />
                                View group
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;