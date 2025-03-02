import React from 'react';
import { Comment as CommentType } from '../types';

interface CommentProps {
  comment: CommentType;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex space-x-3">
      {comment.author.photoURL ? (
        <img
          src={comment.author.photoURL}
          alt={comment.author.name}
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-sm font-semibold text-indigo-600">
            {comment.author.name.charAt(0)}
          </span>
        </div>
      )}
      <div className="flex-1">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="font-medium">{comment.author.name}</div>
          <p className="text-gray-800">{comment.content}</p>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {formatTimestamp(comment.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default Comment;
