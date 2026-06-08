import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

function EmbedVideo() {
  const { postId } = useParams();
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      const postSnap = await getDoc(doc(db, "posts", postId));
      if (postSnap.exists()) {
        setVideoUrl(postSnap.data().videoURL);
      }
    };
    fetchVideo();
  }, [postId]);

  if (!videoUrl) return <div style={{background: '#000', height: '100vh'}}></div>;

  return (
    <div style={{ margin: 0, padding: 0, backgroundColor: '#000', height: '100vh', display: 'flex', alignItems: 'center' }}>
      <video 
        src={videoUrl} 
        controls 
        style={{ width: '100%', maxHeight: '100%' }}
        playsInline
      />
    </div>
  );
}

export default EmbedVideo;
