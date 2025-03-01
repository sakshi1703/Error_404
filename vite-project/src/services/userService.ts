import { ref, get, query, orderByChild, limitToLast, update } from 'firebase/database';
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
    const usersRef = query(
      ref(database, 'users'),
      orderByChild('connections'),
      limitToLast(limit + 1) // Fetch one extra to filter out current user if needed
    );
    
    const snapshot = await get(usersRef);
    const users: User[] = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val() as User;
        if (user.id !== currentUserId) {
          users.push(user);
        }
      });
    }
    
    return users.slice(0, limit);
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    throw error;
  }
};

export const connectWithUser = async (currentUserId: string, targetUserId: string) => {
  try {
    // Update current user's connections
    const currentUserRef = ref(database, `users/${currentUserId}`);
    const currentUserSnapshot = await get(currentUserRef);
    
    if (currentUserSnapshot.exists()) {
      const currentUser = currentUserSnapshot.val() as User;
      await update(currentUserRef, { 
        connections: (currentUser.connections || 0) + 1 
      });
    }
    
    // Update target user's connections
    const targetUserRef = ref(database, `users/${targetUserId}`);
    const targetUserSnapshot = await get(targetUserRef);
    
    if (targetUserSnapshot.exists()) {
      const targetUser = targetUserSnapshot.val() as User;
      await update(targetUserRef, { 
        connections: (targetUser.connections || 0) + 1 
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error connecting with user:', error);
    throw error;
  }
};