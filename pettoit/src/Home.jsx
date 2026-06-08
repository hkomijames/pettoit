import { useState, useEffect, lazy, Suspense } from "react";
import { db } from "./firebase";
import { collection, query, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { useInView } from "react-intersection-observer"; // npm install react-intersection-observer
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";

// Performance: Lazy load sidebars so they don't block the main feed render
const LeftSidebar = lazy(() => import("./LeftSidebar"));
const RightSidebar = lazy(() => import("./RightSidebar"));

const POSTS_PER_PAGE = 3;

function Homepage() {
    const [posts, setPosts] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Observer for Infinite Scroll
    const { ref, inView } = useInView({ threshold: 0 });

    const fetchPosts = async (isFirstLoad = false) => {
        if (loading || (!isFirstLoad && !hasMore)) return;
        
        setLoading(true);
        try {
            const postsQuery = isFirstLoad 
                ? query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(POSTS_PER_PAGE))
                : query(collection(db, "posts"), orderBy("timestamp", "desc"), startAfter(lastDoc), limit(POSTS_PER_PAGE));

            const snap = await getDocs(postsQuery);
            
            if (!snap.empty) {
                const newPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setLastDoc(snap.docs[snap.docs.length - 1]);
                setPosts(prev => isFirstLoad ? newPosts : [...prev, ...newPosts]);
                setHasMore(snap.docs.length === POSTS_PER_PAGE);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error fetching posts:", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchPosts(true);
    }, []);

    // Fetch more when user scrolls to the bottom
    useEffect(() => {
        if (inView && hasMore && !loading) {
            fetchPosts();
        }
    }, [inView, hasMore, loading]);

    return (
        <div className="flex justify-center py-5">
            <Suspense fallback={<div className="hidden lg:block w-64" />}>
                <LeftSidebar />
            </Suspense>
            
            <div className="w-full lg:w-1/2 px-4 flex flex-col items-center">
                <CreatePost />

                {posts.map((post, index) => (
                    <PostCard key={post.id} postId={post.id} priority={index < 3} />
                ))}

                {/* Sentinel element for Infinite Scroll */}
                <div ref={ref} className="w-full py-10 flex justify-center">
                    {loading && (
                        <div className="text-gray-400 animate-pulse">Loading more posts...</div>
                    )}
                    {!hasMore && posts.length > 0 && (
                        <p className="text-gray-400">You've reached the end!</p>
                    )}
                </div>
            </div>
            
            <Suspense fallback={<div className="hidden lg:block w-64" />}>
                <RightSidebar />
            </Suspense>
        </div>
    );
}

export default Homepage;
