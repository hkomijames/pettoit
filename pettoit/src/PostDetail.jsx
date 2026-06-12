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
import AmazonProducts from "./UnderPostAddProducts";
import ShareButtons from "./ShareButtons";
import defaultPostImage from "./assets/defaultPostImage.jpg";

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

    if (loading) return <PetLoader />;
    if (!postData) return <PageNotFound />;

    return (
        <div className="flex mt-10 lg:w-[80%] gap-4 justify-center items-start mx-auto relative">
            <LeftSidebar />
            <div className="lg:w-1/2 md:w-5/5 flex flex-col items-center h-auto">
                <PostCard postId={postId} />

                {/* SHARE BUTTONS */}
                <ShareButtons 
  url={`https://pettoit.com/post/${postId}`}
  title={postData?.title || "Check this out!"} 
  imageUrl={postData?.imageURL || postData?.imageURLs?.[0] || defaultPostImage} 
/>
            <h2 className="mt-4 text-white font-bold text-xl">Comment</h2>
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
                
                <AmazonProducts />

            </div>
            <RightSidebar />
        </div>
    );
}

export default PostDetail;
