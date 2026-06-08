import { useState, useEffect, useRef } from 'react';
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import dogPawPrint from "./assets/dog-paw-print.png";
import { Link } from "react-router";
import { MoreVertical } from "lucide-react";
import DeleteComment from "./DeleteComment";
import EditComment from "./EditComment";

function Comment({ postId, parentId = null, onCommentAdded, commentData }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [authorProfile, setAuthorProfile] = useState(null);
  const actionMenuRef = useRef(null);

  useEffect(() => {
    async function fetchCommenterProfile() {
      if (commentData?.authorId) {
        const profileDoc = await getDoc(doc(db, "pets", commentData.authorId));
        if (profileDoc.exists()) setAuthorProfile(profileDoc.data());
      }
    }
    fetchCommenterProfile();
  }, [commentData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("You must be logged in to post a comment.");
      return;
    }

    if (!auth.currentUser.emailVerified) {
      alert("Please verify your email to post a comment.");
      return;
    }

    if (content.trim() === "") {
      alert("Comment cannot be empty.");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "comments"), {
        content,
        postId,
        parentId: commentData ? commentData.id : null,
        authorId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
      setContent('');
      setIsReplying(false);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = authorProfile?.username || "Anonymous";
  const displayAvatar = authorProfile?.profilePic || dogPawPrint;

  return (
    <div 
      className="flex flex-col w-full mb-4 border-l-3 border-(--gotham-green) pl-4 relative"
      role="article" 
      aria-label={`Comment by ${displayName}`}
    >
      {commentData && (
        <div className="flex items-start gap-3 mb-2">
          <img 
            src={displayAvatar} 
            alt={`${displayName}'s profile picture`} 
            className="w-8 h-8 rounded-full object-cover border border-white" 
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${displayName}`} aria-label={`View ${displayName}'s profile`}>
                <span className="font-bold text-sm text-green-900">@{displayName}</span>
              </Link>
              <span className="text-[10px] text-gray-800 lowercase tracking-widest">
                {commentData.timestamp?.toDate 
                  ? formatDistanceToNow(commentData.timestamp.toDate()) + ' ago' 
                  : 'just now'}
              </span>

              {auth.currentUser?.uid === commentData.authorId && (
                <div className="relative ml-auto">
                  <button 
                    onClick={() => actionMenuRef.current.classList.toggle("hidden")} 
                    className="text-gray-800 hover:text-green-600 cursor-pointer"
                    aria-label="Comment options"
                    aria-haspopup="true"
                  >
                    <MoreVertical size={14} />
                  </button>
                  <div 
                    ref={actionMenuRef} 
                    role="menu"
                    className="absolute right-0 z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg hidden min-w-100 overflow-hidden"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setIsEditing(true);
                        actionMenuRef.current.classList.add("hidden");
                      }}
                      className="w-full px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-50 text-left border-b border-gray-100"
                    >
                      Edit
                    </button>
                    <DeleteComment 
                      commentId={commentData.id} 
                      authorId={commentData.authorId} 
                      role="menuitem"
                    />
                  </div>
                </div>
              )}
            </div>

            {isEditing ? (
              <EditComment 
                commentId={commentData.id} 
                authorId={commentData.authorId} 
                currentText={commentData.content} 
                onSave={() => setIsEditing(false)} 
                onCancel={() => setIsEditing(false)} 
              />
            ) : (
              <>
                <p className="text-gray-800 text-sm my-1">{commentData.content}</p>
                {!commentData.parentId && (
                  <button 
                    onClick={() => setIsReplying(!isReplying)}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                    aria-expanded={isReplying}
                    aria-label={isReplying ? "Cancel reply" : "Reply to this comment"}
                  >
                    {isReplying ? "Cancel" : "Reply"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {(isReplying || !commentData) && (
        <form 
            onSubmit={handleSubmit} 
            className="mt-2 w-full lg:w-3/4"
            aria-label={parentId || commentData?.id ? "Reply to comment" : "Post a new comment"}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={parentId || commentData?.id ? "Write a reply..." : "Write a comment..."}
            aria-required="true"
            className="w-full p-2 border border-gray-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-green-400 outline-none"
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="mt-2 px-4 py-1 bg-green-500 text-white text-sm font-bold rounded-full hover:bg-green-600 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? "Posting..." : (parentId || commentData) ? "Reply" : "Post"}
          </button>
        </form>
      )}
    </div>
  );
}

export default Comment;
