import { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Image, Video, Send, Loader2, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { validateMediaFile } from './utils/security';

function CreatePost() {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const successMessageRef = useRef(null);

  // --- NEW: Handle Image Selection ---
  const handleImageChange = (e) => {
    if (video) {
      alert("You cannot upload images while a video is attached.");
      return;
    }
    const selectedFiles = Array.from(e.target.files);
    setImages(prev => [...prev, ...selectedFiles]);
  };

  // --- NEW: Handle Video Selection ---
  const handleVideoChange = (e) => {
  if (images.length > 0) {
    alert("You cannot upload a video while images are attached.");
    return;
  }
  if (video) {
    alert("You can only upload one video per post.");
    return;
  }
  if (e.target.files && e.target.files[0]) {
    setVideo(e.target.files[0]); // Captures only the single file object
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) return alert("Please log in to post.");
    if (!auth.currentUser.emailVerified) return alert("Please verify your email to post.");
    if (loading) return;

    setLoading(true);

    try {
      const postData = {
        content,
        author: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
      };

      if (images.length > 0) {
        const uploadPromises = images.map(async (file) => {
          const { safeFileName } = validateMediaFile(file); 
          
          const options = {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: 0.75 
          };

          const webpBlob = await imageCompression(file, options);
          const finalName = safeFileName.split('.')[0] + '.webp';
          const imageRef = ref(storage, `posts/${auth.currentUser.uid}/images/${finalName}`);

          const metadata = {
            contentType: 'image/webp',
            cacheControl: 'public,max-age=31536000', 
          };

          await uploadBytes(imageRef, webpBlob, metadata);
          return getDownloadURL(imageRef);
        });

        const urls = await Promise.all(uploadPromises);
        postData.imageURLs = urls;
      }

      if (video) {
        const { safeFileName } = validateMediaFile(video);
        const videoRef = ref(storage, `posts/${auth.currentUser.uid}/videos/${safeFileName}`);
        await uploadBytes(videoRef, video);
        postData.videoURL = await getDownloadURL(videoRef);
      }

      await addDoc(collection(db, "posts"), postData);
      
      setIsSuccess(true);
      setContent('');
      setImages([]);
      setVideo(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      
    } catch (error) {
      console.error("Post creation error:", error);
      alert(error.message); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      successMessageRef.current.style.opacity = 1;
      const timer = setTimeout(() => {
        successMessageRef.current.style.opacity = 0;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return (
    <div className='w-full relative mx-auto p-4 bg-white rounded-xl shadow-md border border-gray-200 mb-6'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <textarea
          name='text field'
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          disabled={loading}
          placeholder="What's on your mind?"
          className='w-full p-2 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 placeholder-gray-400 disabled:opacity-50'
        />

        {isSuccess && (
          <div ref={successMessageRef} className="post-success-message text-center w-full absolute top-1/3 left-1/2 transform -translate-x-1/2 border bg-green-700 p-4 font-bold text-white rounded-lg shadow-lg">
            <p>Posted Successfully!</p>
          </div>
        )}
        
        {/* Updated Change Handlers */}
        <input 
          type="file" 
          accept="image/*"
          multiple 
          hidden 
          ref={imageInputRef} 
          onChange={handleImageChange} 
        />
        <input 
          type="file" 
          accept="video/*" 
          hidden 
          ref={videoInputRef} 
          onChange={handleVideoChange} 
        />

        {/* File Previews / Selection Indicators */}
        {(images.length > 0 || video) && (
          <div className="flex flex-wrap gap-2 px-2">
            {images.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                <span className="truncate max-w-100">📸 {file.name}</span>
                <button 
                  type="button" 
                  onClick={() => {
                    setImages(images.filter((_, i) => i !== index));
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }} 
                  className="hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {video && (
              <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-medium">
                <span className="truncate max-w-100">🎥 {video.name}</span>
                <button 
                  type="button" 
                  onClick={() => {
                    setVideo(null);
                    if (videoInputRef.current) videoInputRef.current.value = "";
                  }} 
                  className="hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
          <div className='flex gap-1'>
            {/* Disabled UI if video is selected */}
            <button
              aria-label='Upload post image'
              aria-haspopup='dialog'
              type="button"
              disabled={loading || !!video}
              onClick={() => imageInputRef.current.click()}
              className='p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-500 rounded-full transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer'
            >
              <Image size={22} color={video ? 'gray' : 'green'} />
            </button>
            {/* Disabled UI if images are selected */}
            <button
  aria-label='Upload post video'
  aria-haspopup='dialog'
  type="button"
  disabled={loading || images.length > 0 || !!video}
  onClick={() => videoInputRef.current.click()}
  className='p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-500 rounded-full transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer'
>
  <Video size={22} color={(images.length > 0 || video) ? 'gray' : 'purple'} />
</button>
          </div>

          {(content || images.length > 0 || video) ? (
            <button 
              type="button"
              onClick={() => {
                if (confirm("Discard this post?")) {
                  setContent('');
                  setImages([]);
                  setVideo(null);
                  if (imageInputRef.current) imageInputRef.current.value = "";
                  if (videoInputRef.current) videoInputRef.current.value = "";
                }
              }}
              className='px-4 py-2 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-all cursor-pointer'
            >
              Discard
            </button>
          ) : ""}

          <button 
            type="submit"
            className='flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer'
            disabled={loading || (!content.trim() && images.length === 0 && !video)}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Post</span>
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;
