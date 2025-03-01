export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  title?: string;
  connections?: number;
}

export interface Post {
  id: string;
  userId: string;
  author: {
    id: string;
    name: string;
    title?: string;
    photoURL?: string;
  };
  content: string;
  timestamp: number;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  type: 'idea' | 'resource' | '';
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  author: {
    id: string;
    name: string;
    photoURL?: string;
  };
  content: string;
  timestamp: number;
}

export interface Topic {
  name: string;
  count: number;
}