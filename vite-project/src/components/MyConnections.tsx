import React, { useEffect, useState } from 'react';
import { database } from '../firebase/config';
import { ref, get } from 'firebase/database';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  name: string;
  profilePic?: string;
}

const MyConnections: React.FC = () => {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState<User[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchConnections = async () => {
      try {
        const userRef = ref(database, `users/${currentUser.uid}/connections`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const connectionsArray: User[] = Object.values(snapshot.val());
          setConnections(connectionsArray);
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      }
    };

    fetchConnections();
  }, [currentUser]);

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">My Connections</h2>
      {connections.length > 0 ? (
        <ul className="space-y-3">
          {connections.map((user) => (
            <li key={user.id} className="flex items-center space-x-3">
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="font-medium">{user.name}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No connections yet.</p>
      )}
    </div>
  );
};

export default MyConnections;
