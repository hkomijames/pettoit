import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router"
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
import ShareButtons from "./ShareButtons";
import defaultPostImage from "./assets/defaultPostImage.jpg";

/* ----------------------------- Time Formatter ----------------------------- */

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Just now";

  const now = new Date();
  const postDate = timestamp.toDate();
  const seconds = Math.floor((now - postDate) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

  // Calculate months
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;

  // Calculate years
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
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
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShareBtnHidden, setIsShareBtnHidden] = useState(false);

  const scrollRef = useRef(null);
  const actionMenuRef = useRef(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const location = useLocation();
  const path = location.pathname;
  const shouldShowButton = path === "/" || path.startsWith("/profile/");
  const isPostPage = location.pathname.startsWith("/post/");
  const showFullContent = isPostPage || isExpanded;

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

  {/*video play/pause on click*/}
  const handlePlayPause = (e) => {
    if (e) e.stopPropagation(); 
    
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  {/* ----------------------------- Share Menu ----------------------------- */}
  const toggleShareMenu = () => {
    setIsShareBtnHidden(!isShareBtnHidden);
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden mb-6 h-fit relative">
      {/* ------------------------------- Header ------------------------------- */}

      <div className="p-4 flex items-center gap-3">
  <img
    src={displayAvatar}
    alt="Avatar"
    className="w-10 h-10 rounded-full object-cover border border-gray-100 bg-gray-50"
  />

  <div className="flex-1">
  <div className="flex items-center gap-2">
    <h3 className="font-bold text-sm text-black">
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

    <p className="text-[13px] text-black tracking-widest">
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

      {isPostPage ? (
  /* Just the content div without a link on the post page */
  <div className="px-5 pb-3">
    {postData.content && (
      <p
        id={`post-body-${postId}`}
        className="text-black text-lg leading-relaxed whitespace-pre-wrap"
      >
        {!showFullContent && postData.content.length > 70
          ? `${postData.content.substring(0, 70)}...`
          : postData.content}
      </p>
    )}
  </div>
) : (
  /* Wrapped in a Link on other pages */
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
          {!showFullContent && postData.content.length > 70
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
              aria-label={isExpanded ? "Show less content" : "Show more content"}
              className="ml-2 text-sm font-bold text-blue-600 hover:underline cursor-pointer"
            >
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          )}
        </p>
      )}
    </div>
  </Link>
)}


      {/* ------------------------------ Media Section ------------------------------ */}

      <div className="px-2 pb-2 relative overflow-hidden">
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
              className="flex overflow-x-auto h-full snap-x snap-mandatory no-scrollbar rounded-2xl"
            >
              {postData.imageURLs.map((url, index) => (
                <div key={`${url}-${index}`} className="flex-none h-full w-full snap-center">
                  <img 
      src={url}
      aria-hidden="true"
      className="absolute inset-0 z-0 w-full h-full object-contain blur-2xl scale-120 opacity-70 pointer-events-none"
      alt=""
    />
                  
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
                    className="w-full relative z-10 h-90 object-contain cursor-zoom-in"
                    alt={`Post visual content ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {postData.videoURL && (
          <div className="relative">
          <video
          ref={videoRef}
            src={`${postData.videoURL}#t=0.001`}
            preload="metadata"
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            controls
            className="w-full object-contain select-none rounded-2xl max-h-96 mt-2"
          />
          {!isPlaying && (
      <button
        aria-label="Play video"
        onClick={handlePlayPause}
        className="absolute inset-0 bottom-0 m-auto flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-blue-700 cursor-pointer text-white rounded-full shadow-lg transition-transform transform hover:scale-110"
      >
        {/* Custom Play Icon (SVG) */}
        <svg xmlns="http://w3.org" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
          <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
        </svg>
      </button>
    )}
          </div>
        )}
        
      </div>

      {/* ------------------------------- Actions ------------------------------- */}

      <div className="p-5 pt-2">
        <div className="flex justify-between border-t border-gray-50 pt-4 text-gray-400">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer">
              <Paws postId={postData.id} initialCount={postData.pawCount} />
            </div>
          </div>
          <div className="flex justify-center">
      {shouldShowButton && (
<button 
          onClick={toggleShareMenu}
          aria-haspopup="true"
          aria-expanded={isShareBtnHidden}
          type="button"
          className="bg-[#ffaa01] text-white w-20 h-10 rounded font-bold cursor-pointer">
            Share
          </button>
          )}
</div>
<Link to={`/post/${postId}`}>
            <div className="flex items-center gap-1.5 mt-3 hover:text-blue-500 transition-colors cursor-pointer">
              <MessageCircle size={20} color="var(--gotham-green)" />
              <span className="text-sm font-semibold text-(--sea-green)">{!commentCount ? "" : commentCount} Comment{commentCount !== 1 ? 's' : ''}</span>
            </div>
            </Link>
        </div>
      </div>

        {isShareBtnHidden && (
<div className="flex items-center justify-center mb-2">
  <ShareButtons 
      url={`https://pettoit.com/post/${postId}`}
      title={postData?.title || "Check this out!"} 
      imageUrl={postData?.imageURL || postData?.imageURLs?.[0] || defaultPostImage}
      />
</div>
        )}
      
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
      type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2 bg-red-300 hover:bg-red-400 cursor-pointer rounded-full text-white"
      >
        <X size={28} />
      </button>

      {/* Left Arrow */}
      {images.length > 1 && currentIndex > 0 && (
        <button
        type="button"
          aria-label="Previous image"
          onClick={handlePrev}
          className="absolute left-6 z-50 p-3 bg-[#ffaa01] hover:bg-(--sea-green) cursor-pointer rounded-full text-white transition"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Right Arrow */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
        type="button"
          aria-label="Next image"
          onClick={handleNext}
          className="absolute right-6 z-50 p-3 bg-[#ffaa01] hover:bg-(--sea-green) cursor-pointer rounded-full text-white transition"
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
            key={`${url}-${index}`}
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