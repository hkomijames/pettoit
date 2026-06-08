import { useState } from "react";
import { auth, db, storage } from "./firebase";
import { doc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Loader2, CheckCircle } from "lucide-react";

function DeletePost({ postId, authorId, imageURLs, videoURL, imageURL }) {
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const isOwner = auth.currentUser?.uid === authorId;
    if (!isOwner) return null;

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!window.confirm("Delete post? This will permanently remove all images, comments, and paws.")) return;
        
        setLoading(true);
        try {
            // 1. Storage Deletion
            const deletePromises = [];
            if (imageURLs?.length > 0) imageURLs.forEach(url => deletePromises.push(deleteObject(ref(storage, url))));
            if (imageURL) deletePromises.push(deleteObject(ref(storage, imageURL)));
            if (videoURL) deletePromises.push(deleteObject(ref(storage, videoURL)));
            await Promise.all(deletePromises.map(p => p.catch(() => {})));

            // 2. Prepare Batch
            const batch = writeBatch(db);

            // Fetch Comments & Paws
            const commentsSnap = await getDocs(query(collection(db, "comments"), where("postId", "==", postId)));
            const pawsSnap = await getDocs(query(collection(db, "paws"), where("postId", "==", postId)));

            // 3. Add deletions to batch
            batch.delete(doc(db, "posts", postId));
            commentsSnap.forEach((d) => batch.delete(d.ref));
            pawsSnap.forEach((d) => batch.delete(d.ref));

            await batch.commit();

            // 4. Show success toast and reload
            setShowToast(true);
            setTimeout(() => {
                window.location.reload();
            }, 2000); // Give user 2 seconds to see the message
            
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : "Delete Post"}
            </button>

            {/* Success Toast */}
            {showToast && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 border-2 border-white/20">
                    <CheckCircle size={20} />
                    <span className="font-bold">Post and comments deleted!</span>
                </div>
            )}
        </>
    );
}

export default DeletePost;
