export const validateMediaFile = (file) => {
  // 1. Check if file exists
  if (!file) throw new Error("No file selected.");

  // 2. Define Allowed Types
  const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const allowedVideos = ["video/mp4", "video/webm", "video/ogg"];
  
  const isImage = allowedImages.includes(file.type);
  const isVideo = allowedVideos.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error("File type not supported. Use JPG, PNG, WEBP, MP4, or WEBM.");
  }

  // 3. Set Size Limits (5MB for Images, 50MB for Videos)
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image is too large (Max 5MB).");
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error("Video is too large (Max 50MB).");
  }

  // 4. Generate a Safe Random Filename
  // Using a fallback for older browsers or non-HTTPS local dev
  const uuid = self.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  const extension = file.name.split('.').pop();
  const safeFileName = `${uuid}_${Date.now()}.${extension}`;

  return { 
    safeFileName, 
    fileType: isImage ? 'image' : 'video',
    mimeType: file.type 
  };
};
