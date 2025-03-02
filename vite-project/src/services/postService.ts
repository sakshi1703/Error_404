import { ref, push, set, get, update, query, orderByChild, limitToLast,onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { Post, Comment } from '../types';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database } from '../firebase/config';

export const createPost = async (userId: string, content: string, authorName: string, authorTitle: string, authorPhotoURL: string, tags: string[] = [], type: 'idea' | 'resource' | '' = '') => {
  
  try {
    const postsRef = ref(database, 'posts');
    const newPostRef = push(postsRef);
    const postId = newPostRef.key;
    
    if (!postId) throw new Error('Failed to generate post ID');
    
    const timestamp = Date.now();
    
    const newPost: Post = {
      id: postId,
      userId,
      author: {
        id: userId,
        name: authorName,
        title: authorTitle,
        photoURL: authorPhotoURL
      },
      content,
      timestamp,
      likes: 0,
      comments: 0,
      shares: 0,
      tags,
      type
    };
    
    await set(newPostRef, newPost);
    
    // Update tag counts
    for (const tag of tags) {
      const tagRef = ref(database, `tags/${tag.replace('#', '')}`);
      const tagSnapshot = await get(tagRef);
      
      if (tagSnapshot.exists()) {
        const currentCount = tagSnapshot.val().count || 0;
        await update(tagRef, { count: currentCount + 1 });
      } else {
        await set(tagRef, { name: tag, count: 1 });
      }
    }
    
    return newPost;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const fileRef = storageRef(storage, `post_images/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file); // Upload the file
    const downloadURL = await getDownloadURL(snapshot.ref); // Get URL
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!currentUser || !userProfile || !content.trim()) return;
  
  setIsSubmitting(true);

  try {
    let imageUrl = '';
    if (image) {
      imageUrl = await uploadImage(image); // Upload image and get URL
    }

    const tagList = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag)
      .map(tag => (tag.startsWith('#') ? tag : `#${tag}`));

    await createPost(
      currentUser.uid,
      content,
      userProfile.displayName,
      userProfile.title || '',
      userProfile.photoURL || '',
      tagList,
      postType,
      imageUrl // Add image URL to post
    );

    setContent('');
    setTags('');
    setPostType('');
    setImage(null); // Reset image
    document.getElementById('post-form-details')?.classList.add('hidden');
    alert('Post added successfully!');
    onPostCreated();
  } catch (error) {
    console.error('Error creating post:', error);
  } finally {
    setIsSubmitting(false);
  }
};


export const getPosts = async (limit = 20) => {
  try {
    const postsRef = query(
      ref(database, 'posts'),
      orderByChild('timestamp'),
      limitToLast(limit)
    );
    
    const snapshot = await get(postsRef);
    const posts: Post[] = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        posts.push(childSnapshot.val() as Post);
      });
    }
    
    return posts.reverse(); // Most recent first
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const likePost = async (postId: string) => {
  try {
    const postRef = ref(database, `posts/${postId}`);
    const snapshot = await get(postRef);
    
    if (snapshot.exists()) {
      const post = snapshot.val() as Post;
      const newLikes = (post.likes || 0) + 1;
      
      await update(postRef, { likes: newLikes });
      return newLikes;
    }
    
    return 0;
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const addComment = async (postId: string, userId: string, content: string, authorName: string, authorPhotoURL: string) => {
  try {
    // Add the comment
    const commentsRef = ref(database, `comments/${postId}`);
    const newCommentRef = push(commentsRef);
    const commentId = newCommentRef.key;
    
    if (!commentId) throw new Error('Failed to generate comment ID');
    
    const timestamp = Date.now();
    
    const newComment: Comment = {
      id: commentId,
      postId,
      userId,
      author: {
        id: userId,
        name: authorName,
        photoURL: authorPhotoURL
      },
      content,
      timestamp
    };
    
    await set(newCommentRef, newComment);
    
    // Update comment count on the post
    const postRef = ref(database, `posts/${postId}`);
    const postSnapshot = await get(postRef);
    
    if (postSnapshot.exists()) {
      const post = postSnapshot.val() as Post;
      await update(postRef, { comments: (post.comments || 0) + 1 });
    }
    
    return newComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const getComments = async (postId: string) => {
  try {
    const commentsRef = query(
      ref(database, `comments/${postId}`),
      orderByChild('timestamp')
    );
    
    const snapshot = await get(commentsRef);
    const comments: Comment[] = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        comments.push(childSnapshot.val() as Comment);
      });
    }
    
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const sharePost = async (postId: string) => {
  try {
    const postRef = ref(database, `posts/${postId}`);
    const snapshot = await get(postRef);
    
    if (snapshot.exists()) {
      const post = snapshot.val() as Post;
      const newShares = (post.shares || 0) + 1;
      
      await update(postRef, { shares: newShares });
      return newShares;
    }
    
    return 0;
  } catch (error) {
    console.error('Error sharing post:', error);
    throw error;
  }
};

export const getTrendingTopics = async (limit = 5) => {
  try {
    const tagsRef = query(
      ref(database, 'tags'),
      orderByChild('count'),
      limitToLast(limit)
    );
    
    const snapshot = await get(tagsRef);
    const topics: { name: string; count: number }[] = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const tag = childSnapshot.val();
        topics.push({
          name: tag.name,
          count: tag.count
        });
      });
    }
    
    return topics.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    throw error;
  }
};

export const searchPosts = async (query: string) => {
  try {
    // This is a simple implementation. In a real app, you might want to use a more sophisticated search solution
    const postsRef = ref(database, 'posts');
    const snapshot = await get(postsRef);
    const posts: Post[] = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const post = childSnapshot.val() as Post;
        
        // Search in content or tags
        if (
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        ) {
          posts.push(post);
        }
      });
    }
    
    return posts;
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
};

export const listenForComments = (postId: string, callback: (comments: any) => void) => {
  const commentsRef = ref(database, `comments/${postId}`);

  const unsubscribe = onValue(commentsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const comments = Object.values(snapshot.val());
    callback(comments);
  });

  return unsubscribe;
};
