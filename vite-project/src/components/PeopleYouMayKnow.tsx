import React, { useEffect, useState } from 'react';
import { getSuggestedUsers } from '../services/userService';
import { ref, set, get } from 'firebase/database';
import { database } from '../firebase/config';
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
        // Fetch the list of connected users
        const connectionsRef = ref(database, `users/${currentUser.uid}/connections`);
        const connectionsSnapshot = await get(connectionsRef);
        const connectedUserIds = connectionsSnapshot.exists() ? Object.keys(connectionsSnapshot.val()) : [];

        // Fetch suggested users
        const users = await getSuggestedUsers(currentUser.uid);

        // Filter out users who are already connected
        const filteredUsers = users.filter(user => !connectedUserIds.includes(user.id));

        setSuggestedUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, [currentUser]);

  const handleConnect = async (userId: string, user: User) => {
    if (!currentUser) return;

    setConnecting((prev) => ({ ...prev, [userId]: true }));

    try {
      // Store connection in Firebase
      const connectionRef = ref(database, `users/${currentUser.uid}/connections/${userId}`);
      await set(connectionRef, {
        id: user.id,
        name: user.displayName,
        profilePic: user.photoURL || '',
      });

      // Remove user from suggestions after connecting
      setSuggestedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Error connecting with user:', error);
    } finally {
      setConnecting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (!currentUser) return null;

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (suggestedUsers.length === 0) {
    return <p>No suggestions available.</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">People You May Know</h2>
      <div className="space-y-4">
        {suggestedUsers.map((user) => (
          <div key={user.id} className="flex items-center">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-400 flex items-center justify-center text-white font-bold text-lg">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{user.displayName}</p>
            </div>
            <button
              onClick={() => handleConnect(user.id, user)}
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
