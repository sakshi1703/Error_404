import { ref, get, update, set } from 'firebase/database';
import { database } from '../firebase/config';
import { User } from '../types';

export const getUserProfile = async (userId: string) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, updates);
    
    // Get the updated profile
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getSuggestedUsers = async (currentUserId: string, limit = 3) => {
  try {
    // Fetch all users
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    const users: User[] = [];
    
    if (!snapshot.exists()) return [];
    
    const allUsers = snapshot.val();
    
    // Fetch connected users
    const connectionsRef = ref(database, `connections/${currentUserId}`);
    const connectionsSnapshot = await get(connectionsRef);
    const connectedUserIds = connectionsSnapshot.exists() ? Object.keys(connectionsSnapshot.val()) : [];
    
    // Exclude connected users and self
    Object.entries(allUsers).forEach(([uid, user]) => {
      if (uid !== currentUserId && !connectedUserIds.includes(uid)) {
        users.push({ id: uid, ...user });
      }
    });
    
    return users.slice(0, limit);
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    throw error;
  }
};

export const connectWithUser = async (currentUserId: string, targetUserId: string) => {
  try {
    // Store connection for the current user
    const connectionRef = ref(database, `connections/${currentUserId}/${targetUserId}`);
    await set(connectionRef, { connectedAt: new Date().toISOString() });
    
    // Store reverse connection for the target user
    const reverseConnectionRef = ref(database, `connections/${targetUserId}/${currentUserId}`);
    await set(reverseConnectionRef, { connectedAt: new Date().toISOString() });
    
    return true;
  } catch (error) {
    console.error('Error connecting with user:', error);
    throw error;
  }
};
