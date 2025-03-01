import React, { useEffect, useState } from 'react';
import { getSuggestedUsers, connectWithUser } from '../services/userService';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

const PeopleYouMayKnow: React.FC = () => {
  const { currentUser } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const users = await getSuggestedUsers(currentUser.uid);
        setSuggestedUsers(users);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, [currentUser]);

  const handleConnect = async (userId: string) => {
    if (!currentUser) return;

    setConnecting(prev => ({ ...prev, [userId]: true }));

    try {
      await connectWithUser(currentUser.uid, userId);

      // Remove user from suggestions after connecting
      setSuggestedUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error connecting with user:', error);
    } finally {
      setConnecting(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">People You May Know</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="mt-1 h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestedUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">People You May Know</h2>
        <p className="text-gray-500 text-center py-4">No suggestions available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">People You May Know</h2>
      <div className="space-y-4">
        {suggestedUsers.map((user) => (
          <div key={user.id} className="flex items-center">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-indigo-600">
                  {user.displayName.charAt(0)}
                </span>
              </div>
            )}
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-gray-500">{user.title || 'Member'}</p>
            </div>
            <button
              onClick={() => handleConnect(user.id)}
              disabled={connecting[user.id]}
              className="ml-2 px-3 py-1 text-xs font-medium rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              {connecting[user.id] ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeopleYouMayKnow;
