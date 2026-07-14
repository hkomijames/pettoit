import { useState, useEffect } from 'react';
import { db } from "./firebase";
import { doc, writeBatch, getDoc, serverTimestamp } from 'firebase/firestore';

const FollowButton = ({ 
  myUid, 
  targetUid, 
  myUsername, 
  myProfilePic, 
  targetUsername, 
  targetProfilePic,
  setIsFollowingExternal
}) => { 
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!myUid || !targetUid) {
        setLoading(false);
        return;
      }
      try {
        const followRef = doc(db, "pets", myUid, "following", targetUid);
        const docSnap = await getDoc(followRef);
        
        const following = docSnap.exists();
        setIsFollowing(following);
        setIsFollowingExternal?.(following); // 2. Tell the profile page if we are already following
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [myUid, targetUid, setIsFollowingExternal]);

  const handleFollow = async () => {
    if (!myUid || !targetUid) return;
    const batch = writeBatch(db);
    const followingRef = doc(db, "pets", myUid, "following", targetUid);
    const followersRef = doc(db, "pets", targetUid, "followers", myUid);

    try {
      batch.set(followingRef, { followedAt: serverTimestamp(), uid: targetUid, username: targetUsername || "Pet Owner", profilePic: targetProfilePic || "" });
      batch.set(followersRef, { followedAt: serverTimestamp(), uid: myUid, username: myUsername || "Anonymous Pet", profilePic: myProfilePic || "" });
      
      const notifRef = doc(db, "pets", targetUid, "notifications", `${myUid}_follow`);
      batch.set(notifRef, { type: 'follow', fromId: myUid, fromName: myUsername || "A pet owner", timestamp: serverTimestamp(), read: false });
      
      await batch.commit();
      
      setIsFollowing(true);
      setIsFollowingExternal?.(true); // 3. Tell the profile page we just clicked follow
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  if (loading) return null;
  if (!myUid || myUid === targetUid || isFollowing) return null;

  return (
    <button onClick={handleFollow} className="bg-blue-500 hover:bg-[#1A365D] text-white px-2 py-1 cursor-pointer rounded mt-2 mr-2 inline-block" > 
      Follow 
    </button>
  );
};

export default FollowButton;