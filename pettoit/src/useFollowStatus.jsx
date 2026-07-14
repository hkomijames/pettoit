import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Adjust path to your firebase config

export const useFollowStatus = (myUid, targetUid) => {
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
        setIsFollowing(docSnap.exists());
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [myUid, targetUid]);

  return { isFollowing, setIsFollowing, loading };
};
