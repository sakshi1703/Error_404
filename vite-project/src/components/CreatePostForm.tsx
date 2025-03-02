import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { createPost } from '../services/postService';
import { useAuth } from '../context/AuthContext';

interface CreatePostFormProps {
  onPostCreated: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const { currentUser, userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [postType, setPostType] = useState<'idea' | 'resource' | ''>('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !content.trim()) return;
    setIsSubmitting(true);

    try {
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
        image // Pass the image file to createPost
      );

      setContent('');
      setTags('');
      setPostType('');
      setImage(null);
      setPreview(null);
      document.getElementById('post-form-details')?.classList.add('hidden');
      alert('Post added successfully!');
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow mb-2 p-4">
      <div className="flex items-center mb-4">
        {userProfile?.photoURL ? (
          <img src={userProfile.photoURL} alt={userProfile.displayName} className="h-10 w-10 rounded-full mr-3" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
            <span className="text-lg font-semibold text-indigo-600">{userProfile?.displayName.charAt(0) || 'U'}</span>
          </div>
        )}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Share an idea, resource, or skill..."
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button
          className="ml-3 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() => document.getElementById('post-form-details')?.classList.toggle('hidden')}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div id="post-form-details" className="hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full border rounded-md p-2"
            placeholder="Share your thoughts, ideas, or resources..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input type="file" accept="image/*" onChange={handleImageChange} />
          {preview && <img src={preview} alt="Preview" className="w-full h-auto rounded-md mt-2" />}

          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border rounded-md p-2"
          />

          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostForm;
