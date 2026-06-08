import { useState } from "react";
import { auth, db } from "./firebase";
import { doc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { Loader2, CheckCircle } from "lucide-react";

function DeleteComment({ commentId, authorId }) {
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const isOwner = auth.currentUser?.uid === authorId;
    if (!isOwner) return null;

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!window.confirm("Delete this comment? This will also remove any replies.")) return;

        setLoading(true);
        try {
            const batch = writeBatch(db);

            // 1. Reference to the parent comment
            const parentRef = doc(db, "comments", commentId);
            batch.delete(parentRef);

            // 2. Find all replies to this comment
            const repliesQuery = query(
                collection(db, "comments"), 
                where("parentId", "==", commentId)
            );
            const repliesSnap = await getDocs(repliesQuery);

            // 3. Add replies to the delete batch
            repliesSnap.forEach((replyDoc) => {
                batch.delete(replyDoc.ref);
            });

            // 4. Commit everything
            await batch.commit();

            // 5. Trigger the green success box
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000); // Disappears after 3s
            
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button 
                onClick={handleDelete}
                disabled={loading}
                className="w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left cursor-pointer"
            >
                {loading ? <Loader2 size={12} className="animate-spin" /> : "Delete"}
            </button>

            {/* Success Toast - Fixed to bottom-right of screen */}
            {showToast && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-green-500 text-white px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CheckCircle size={18} />
                    <span className="text-sm font-bold">Comment deleted successfully!</span>
                </div>
            )}
        </>
    );
}

export default DeleteComment;
