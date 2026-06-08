import { useState, useEffect } from 'react';
import { db } from "./firebase";
import { doc, writeBatch, getDoc, serverTimestamp } from 'firebase/firestore';

const FollowButton = ({ 
  myUid, 
  targetUid, 
  myUsername, 
  myProfilePic, 
  targetUsername, 
  targetProfilePic 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hooks MUST come first, before any "return null"
  useEffect(() => {
    const checkStatus = async () => {
      if (!myUid || !targetUid) {
        setLoading(false);
        return;
      }
      try {
        const followRef = doc(db, "pets", myUid, "following", targetUid);
        const docSnap = await getDoc(followRef);
        setIsFollowing(docSnap.exists());
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [myUid, targetUid]);

  const handleFollow = async () => {
    if (!myUid || !targetUid) return;

    const batch = writeBatch(db);
    const followingRef = doc(db, "pets", myUid, "following", targetUid);
    const followersRef = doc(db, "pets", targetUid, "followers", myUid);

    try {
        // 1. Save to YOUR "following" list (uses the profile data you are visiting)
        batch.set(followingRef, { 
            followedAt: serverTimestamp(),
            uid: targetUid,
            username: targetUsername || "Pet Owner", 
            profilePic: targetProfilePic || ""
        });

        // 2. Save to THEIR "followers" list (uses YOUR profile data)
        // This is what the Followers.jsx component reads!
        batch.set(followersRef, { 
            followedAt: serverTimestamp(),
            uid: myUid,
            username: myUsername || "Anonymous Pet", 
            profilePic: myProfilePic || ""
        });
      
        // 3. Notification
        const notifRef = doc(db, "pets", targetUid, "notifications", `${myUid}_follow`);
        batch.set(notifRef, {
            type: 'follow',
            fromId: myUid,
            fromName: myUsername || "A pet owner", 
            timestamp: serverTimestamp(),
            read: false
        });

        await batch.commit();
        setIsFollowing(true); 
    } catch (error) {
        console.error("Follow error:", error);
    }
  };

  // Conditional returns MUST come after hooks
  if (loading) return null;
  if (!myUid || myUid === targetUid || isFollowing) return null;

  return (
    <button 
      onClick={handleFollow}
      id="follow-btn"
    >
      Follow
    </button>
  );
};

export default FollowButton;
