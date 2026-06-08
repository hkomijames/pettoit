import { useState, useEffect } from 'react';
import { db, auth } from "./firebase";
import { doc, updateDoc, increment, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";

function Paws({ postId }) {
  const userId = auth.currentUser?.uid;
  
  const [liked, setLiked] = useState(false);
  const [localCount, setLocalCount] = useState(0);

  // 1. Real-time Sync with Firestore
  useEffect(() => {
    if (!postId) return;

    const postRef = doc(db, "posts", postId);
    
    // Listen to the specific post for changes in pawCount and pawavers
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const serverPawavers = data.pawavers || [];
        
        setLocalCount(data.pawCount || 0);
        setLiked(userId ? serverPawavers.includes(userId) : false);
      }
    });

    return () => unsubscribe();
  }, [postId, userId]);

  async function handlePawClick() {
    if (!userId) return alert("Please log in to paw this post.");
    if (!auth.currentUser.emailVerified) return alert("Please verify your email to paw this post.");

    const postRef = doc(db, "posts", postId);
    const willBeLiked = !liked;

    // 2. Optimistic Update (UI feels instant)
    setLiked(willBeLiked);
    setLocalCount(prev => willBeLiked ? prev + 1 : prev - 1);

    try {
      await updateDoc(postRef, {
        // arrayUnion and arrayRemove automatically handle uniqueness!
        // Even if called twice, a UID can only exist ONCE in an array.
        pawCount: increment(willBeLiked ? 1 : -1),
        pawavers: willBeLiked ? arrayUnion(userId) : arrayRemove(userId)
      });
    } catch (error) {
      console.error("Error updating paw:", error);
      // Revert on error
      setLiked(!willBeLiked);
      setLocalCount(prev => !willBeLiked ? prev + 1 : prev - 1);
    }
  }

  return (
    <button 
      onClick={handlePawClick} 
      aria-label={liked ? "Unlike post" : "Like post"}
      className="flex items-center gap-1.5 transition-all hover:scale-110 active:scale-90 cursor-pointer"
    >
      <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-lg drop-shadow-green-700">
        <g 
          stroke={liked ? "var(--sea-green)" : "var(--brunswick-green)"} 
          fill={liked ? "var(--gotham-green)" : "white"} 
          strokeWidth="4"
          className="transition-colors duration-500"
        >
          <path d="M50 50 C35 50 28 65 28 75 C28 85 38 90 50 90 C62 90 72 85 72 75 C72 65 65 50 50 50 Z" />
          <ellipse cx="25" cy="45" rx="8" ry="11" transform="rotate(-20 25 45)" />
          <ellipse cx="40" cy="32" rx="8" ry="11" />
          <ellipse cx="60" cy="32" rx="8" ry="11" />
          <ellipse cx="75" cy="45" rx="8" ry="11" transform="rotate(20 75 45)" />
        </g>
      </svg>
      <span className={`text-md font-semibold ${liked ? 'text-green-500' : 'text-black'}`}>
        {localCount > 0 ? localCount : ""} {localCount === 1 ? 'Paw' : 'Paws'}
      </span>
    </button>
  );
}

export default Paws;