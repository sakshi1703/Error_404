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
  const [postType, setPostType] = useState<'idea' | 'resource' |'skill'| ''>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!currentUser || !userProfile || !content.trim()) {
      console.error('User not logged in or content is empty');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      // Process tags
      const tagList = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => (tag.startsWith('#') ? tag : `#${tag}`));
  
      console.log('Tags processed:', tagList);
  
      // Log the image Base64 string (for debugging)
      if (imageBase64) {
        console.log('Image Base64 string:', imageBase64.substring(0, 50) + '...');
      } else {
        console.log('No image uploaded');
      }
  
      // Create post with image as Base64 string
      await createPost(
        currentUser.uid,
        content,
        userProfile.displayName || 'Anonymous', // Fallback to 'Anonymous'
        userProfile.title || '', // Fallback to empty string
        userProfile.photoURL || '', // Fallback to empty string
        tagList,
        postType,
        imageBase64 // Pass the Base64 image string
      );
  
      console.log('Post created successfully in Firestore');
  
      // Clear input fields
      setContent('');
      setTags('');
      setPostType('');
      setImageBase64(null);
  
      // Close the form
      document.getElementById('post-form-details')?.classList.add('hidden');
  
      // Notify user
      alert('Post added successfully!');
  
      // Trigger parent update
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        // Convert the image to a Base64 string
        const base64String = reader.result as string;
        console.log('Image converted to Base64:', base64String.substring(0, 50) + '...'); // Log first 50 chars
        setImageBase64(base64String);
      };

      reader.onerror = () => {
        console.error('Error reading file:', reader.error);
      };

      reader.readAsDataURL(file); // Read the file as a data URL (Base64)
    }
  };

  if (!currentUser) {
    console.error('User not logged in');
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6 p-4">
      <div className="flex items-center mb-4">
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt={userProfile.displayName}
            className="h-10 w-10 rounded-full mr-3"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
            <span className="text-lg font-semibold text-indigo-600">
              {userProfile?.displayName.charAt(0) || 'U'}
            </span>
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
          className="ml-3 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() =>
            document.getElementById('post-form-details')?.classList.toggle('hidden')
          }
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div id="post-form-details" className="hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="post-content" className="block text-sm font-medium text-gray-700">
              What would you like to share?
            </label>
            <textarea
              id="post-content"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Share your thoughts, ideas, or resources..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label htmlFor="post-tags" className="block text-sm font-medium text-gray-700">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="post-tags"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., #Design, #Development, #Collaboration"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Post Type</label>
            <div className="mt-1 flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  name="post-type"
                  value="idea"
                  checked={postType === 'idea'}
                  onChange={() => setPostType('idea')}
                />
                <span className="ml-2">Idea</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  name="post-type"
                  value="resource"
                  checked={postType === 'resource'}
                  onChange={() => setPostType('resource')}
                />
                <span className="ml-2">Resource</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  name="post-type"
                  value="resource"
                  checked={postType === 'skill'}
                  onChange={() => setPostType('skill')}
                />
                <span className="ml-2">Skills</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  name="post-type"
                  value=""
                  checked={postType === ''}
                  onChange={() => setPostType('')}
                />
                <span className="ml-2">None</span>
              </label>
            </div>
          </div>

          {/* Image Upload Input */}
          <div>
            <label htmlFor="post-image" className="block text-sm font-medium text-gray-700">
              Upload Image (Optional)
            </label>
            <input
              type="file"
              id="post-image"
              accept="image/*"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              onChange={handleImageChange}
            />
            {imageBase64 && (
              <div className="mt-2">
                <img
                  src={imageBase64}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => document.getElementById('post-form-details')?.classList.add('hidden')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostForm;