import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { MessageCircle, Share2, MoreHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import dogPawPrint from "./assets/dog-paw-print.png";
import { Link } from "react-router";
import Paws from "./Paws";
import DeletePost from "./DeletePost";
import FollowButton from "./FollowButton";

/* ----------------------------- Time Formatter ----------------------------- */

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Just now";

  const now = new Date();
  const postDate = timestamp.toDate();
  const seconds = Math.floor((now - postDate) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return postDate.toLocaleDateString();
};

/* -------------------------------------------------------------------------- */
/*                                  PostCard                                  */
/* -------------------------------------------------------------------------- */

function PostCard({ postId, priority = false }) {
  const [postData, setPostData] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  const scrollRef = useRef(null);
  const actionMenuRef = useRef(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  /* ------------------------------ Fetch Data ------------------------------ */

  useEffect(() => {
    let isMounted = true;
    if (!postId) return;

    async function fetchData() {

      try {
        const postDoc = await getDoc(doc(db, "posts", postId));

        if (!postDoc.exists() || !isMounted) return;

        const data = postDoc.data();

        // 🔥 Normalize images (single + multiple unified)
        const normalizedImages = data.imageURLs
          ? data.imageURLs
          : data.imageURL
          ? [data.imageURL]
          : [];

        setPostData({
          ...data,
          id: postDoc.id,
          imageURLs: normalizedImages,
        });

        if (data.author) {
          const profileDoc = await getDoc(doc(db, "pets", data.author));
          if (profileDoc.exists() && isMounted) {
            setAuthorProfile(profileDoc.data());
          }
        }

        if (currentUser?.uid && isMounted) {
          const myDoc = await getDoc(doc(db, "pets", currentUser.uid));
          if (myDoc.exists()) {
            setMyProfile(myDoc.data());
          }
        }
      } catch (err) {
        console.error("Error fetching PostCard data:", err);
      }
    }

    fetchData();

const q = query(collection(db, "comments"), where("postId", "==", postId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (isMounted) {
      setCommentCount(snapshot.size);
    }
  });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [postId, currentUser?.uid]);

  if (!postData)
    return (
      <div className="w-full h-40 bg-gray-50 animate-pulse rounded-4xl mb-4" />
    );

  const displayName = authorProfile?.username;
  const displayAvatar = authorProfile?.profilePic || dogPawPrint;

  /* ----------------------------- Scroll Handler ---------------------------- */

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / clientWidth) + 1;
    setCurrentIndex(index);
  };

  return (
    <div className="lg:w-2/3 md:w-full w-full bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden mb-6 h-fit relative">
      {/* ------------------------------- Header ------------------------------- */}

      <div className="p-4 flex items-center gap-3">
  <img
    src={displayAvatar}
    alt="Avatar"
    className="w-10 h-10 rounded-full object-cover border border-gray-100 bg-gray-50"
  />

  <div className="flex-1">
  <div className="flex items-center gap-2">
    <h3 className="font-bold text-sm text-gray-900">
      <Link to={`/profile/${authorProfile?.username}`}>
        @{displayName}
      </Link>
    </h3>

    {authorProfile && myProfile && (
      <FollowButton 
        myUid={currentUser?.uid}           
        targetUid={postData.author}        
        myUsername={myProfile?.username}   
        myProfilePic={myProfile?.profilePic} 
        targetUsername={authorProfile?.username} 
        targetProfilePic={authorProfile?.profilePic} 
      />
    )}
  </div>

    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
      {formatRelativeTime(postData.timestamp)}
    </p>
  </div>

  <button
    onClick={(e) => {
      e.preventDefault();
      const isHidden = actionMenuRef.current.classList.toggle("hidden");
      e.currentTarget.setAttribute("aria-expanded", !isHidden);
    }}
    aria-haspopup="menu"
    aria-expanded="false"
    aria-label="Post options"
    className="text-black hover:text-green-600 cursor-pointer"
  >
    <MoreHorizontal size={24} />
  </button>

<div 
  ref={actionMenuRef} 
  role="menu"
  className="hidden absolute top-14 right-2 z-50 bg-green-200 border border-gray-200 rounded-xl p-2 shadow-lg"
>
  <DeletePost 
    postId={postData.id} 
    imageURLs={postData.imageURLs} 
    videoURL={postData.videoURL} 
    imageURL={postData.imageURL} 
    authorId={postData.author} 
  />
</div>

      </div>

      {/* ------------------------------ Text Content ------------------------------ */}

      <Link
        to={`/post/${postId}`}
        className="block hover:opacity-95 transition-opacity"
      >
        <div className="px-5 pb-3">
          {postData.content && (
            <p
              id={`post-body-${postId}`}
              className="text-black text-lg leading-relaxed whitespace-pre-wrap"
            >
              {!isExpanded && postData.content.length > 70
                ? `${postData.content.substring(0, 70)}...`
                : postData.content}

              {postData.content.length > 70 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={`post-body-${postId}`}
                  aria-label={
                    isExpanded ? "Show less content" : "Show more content"
                  }
                  className="ml-2 text-sm font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              )}
            </p>
          )}
        </div>
      </Link>

      {/* ------------------------------ Media Section ------------------------------ */}

      <div className="px-2 pb-2 relative">
        {postData.imageURLs.length > 0 && (
          <>
            {postData.imageURLs.length > 1 && (
              <div aria-hidden="true" className="absolute top-5 right-5 z-10 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                {currentIndex} / {postData.imageURLs.length}
              </div>
            )}

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              role="region"
              className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-2xl"
            >
              {postData.imageURLs.map((url, index) => (
                <div key={index} className="flex-none w-full snap-center">
                  <img
                    src={url}
                    loading={(priority && index === 0) ? "eager" : "lazy"}
                    role="button"
                    tabIndex="0"
                    aria-label={`View image ${index + 1} of ${postData.imageURLs.length} in full screen`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedImageIndex(index);
                      setIsLightboxOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                       setSelectedImageIndex(index);
                       setIsLightboxOpen(true);
                      }
                    }}
                    className="w-full aspect-square object-cover border border-gray-100 cursor-zoom-in"
                    alt={`Post visual content ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {postData.videoURL && (
          <video
            src={postData.videoURL}
            preload={priority ? "metadata" : "none"}
            controls
            className="w-full rounded-2xl bg-black max-h-96 mt-2"
          />
        )}
      </div>

      {/* ------------------------------- Actions ------------------------------- */}

      <div className="p-5 pt-2">
        <div className="flex justify-between border-t border-gray-50 pt-4 text-gray-400">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer">
              <Paws postId={postData.id} initialCount={postData.pawCount} />
            </div>
<Link to={`/post/${postId}`}>
            <div className="flex items-center gap-1.5 mt-3 hover:text-blue-500 transition-colors cursor-pointer">
              <MessageCircle size={20} color="var(--gotham-green)" />
              <span className="text-sm font-semibold text-(--sea-green)">{!commentCount ? "" : commentCount} Comment{commentCount !== 1 ? 's' : ''}</span>
            </div>
            </Link>
          </div>

          <Share2 size={18} className="hover:text-amber-500 cursor-pointer" />
        </div>
      </div>

      {/* ------------------------------ Lightbox ------------------------------ */}

      {isLightboxOpen && (
        <Lightbox
          images={postData.imageURLs}
          startIndex={selectedImageIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Lightbox                                  */
/* -------------------------------------------------------------------------- */

const Lightbox = ({ images, startIndex, onClose }) => {
  const lightboxRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  /* ---------------- Scroll Lock ---------------- */

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  /* ---------------- ESC Close ---------------- */

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  /* ---------------- Initial Scroll ---------------- */

  useEffect(() => {
    if (lightboxRef.current) {
      const width = lightboxRef.current.clientWidth;
      lightboxRef.current.scrollTo({
        left: startIndex * width,
        behavior: "instant",
      });
    }
  }, [startIndex]);

  /* ---------------- Track Scroll ---------------- */

  const handleScroll = () => {
    if (!lightboxRef.current) return;
    const { scrollLeft, clientWidth } = lightboxRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setCurrentIndex(index);
  };

  /* ---------------- Navigation ---------------- */

  const handleNext = () => {
    if (!lightboxRef.current) return;
    if (currentIndex >= images.length - 1) return;

    const width = lightboxRef.current.clientWidth;
    lightboxRef.current.scrollTo({
      left: (currentIndex + 1) * width,
      behavior: "smooth",
    });
  };

  const handlePrev = () => {
    if (!lightboxRef.current) return;
    if (currentIndex <= 0) return;

    const width = lightboxRef.current.clientWidth;
    lightboxRef.current.scrollTo({
      left: (currentIndex - 1) * width,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
      >
        <X size={28} />
      </button>

      {/* Left Arrow */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Right Arrow */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Slider */}
      <div
        ref={lightboxRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {images.map((url, index) => (
          <div
            key={index}
            className="flex-none w-full h-full flex items-center justify-center snap-center p-4"
          >
            <img
              src={url}
              className="max-w-full max-h-full object-contain"
              alt={`Zoomed ${index}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostCard;