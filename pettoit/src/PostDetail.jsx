import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { db } from "./firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import PostCard from "./PostCard";
import PetLoader from "./PetLoader";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import Comment from "./Comment";
import { Share2 } from "lucide-react";
import PageNotFound from "./404page"

function PostDetail() {
    const { postId } = useParams();
    const [loading, setLoading] = useState(true);
    const [postData, setPostData] = useState(null);
    const [comments, setComments] = useState([]);

    useEffect(() => {
        async function fetchPost() {
            try {
                const postDoc = doc(db, "posts", postId);
                const postSnap = await getDoc(postDoc);
                if (postSnap.exists()) {
                    setPostData(postSnap.data());
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPost();

        const q = query(
            collection(db, "comments"),
            where("postId", "==", postId),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(fetchedComments);
        });

        return () => unsubscribe();
    }, [postId]);

    const handleCopyEmbed = () => {
        const embedCode = `<iframe width="560" height="315" src="https://pettoit.com/embed/${postId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        navigator.clipboard.writeText(embedCode);
        alert("Embed code copied to clipboard!");
    };

    if (loading) return <PetLoader />;
    if (!postData) return <PageNotFound />;

    return (
        <div className="flex mt-10 gap-4 justify-center relative">
            <LeftSidebar />
            <div className="lg:w-1/2 md:w-5/5 flex flex-col items-center h-auto">
                <PostCard postId={postId} />

                {/* EMBED SECTION: Only show if post has a video */}
                {postData.videoURL && (
                    <div className="w-full lg:w-2/3 bg-gray-100 p-3 rounded-lg mb-4 flex items-center justify-between border border-gray-300">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Share2 size={16} /> Share this video
                        </span>
                        <button 
                            onClick={handleCopyEmbed}
                            className="bg-(--gotham-green) text-white px-3 py-1 rounded-md text-xs hover:opacity-80 transition-all"
                        >
                            Copy Embed Code
                        </button>
                    </div>
                )}

                <div className="w-full lg:w-2/3 flex justify-center mb-2">
                    <Comment postId={postId} parentId={null} />
                </div>

                <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md p-4">
                    {comments
                        .filter(c => !c.parentId)
                        .map(parentComment => (
                            <div key={parentComment.id} className="mb-6">
                                <Comment postId={postId} commentData={parentComment} />
                                <div className="ml-10 border-l-3 border-(--gotham-green) pl-4">
                                    {comments
                                        .filter(reply => reply.parentId === parentComment.id)
                                        .sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate())
                                        .map(reply => (
                                            <Comment
                                                key={reply.id}
                                                postId={postId}
                                                parentId={parentComment.id}
                                                commentData={reply}
                                            />
                                        ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            <RightSidebar />
        </div>
    );
}

export default PostDetail;
