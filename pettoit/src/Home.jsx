import { useState, useEffect, lazy, Suspense } from "react";
import { db } from "./firebase";
import React from "react";
import { collection, query, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { useInView } from "react-intersection-observer"; 
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import ProductsCatalog from "./AmazonProducts";

//Performance fixes: Lazy load components that pull external data or scripts
const LeftSidebar = lazy(() => import("./LeftSidebar"));
const RightSidebar = lazy(() => import("./RightSidebar"));
const AmazonAdds = lazy(() => import("./AmazonAdds")); // Lazy load Amazon scripts

const POSTS_PER_PAGE = 3;

// A simple loading skeleton box to prevent layout shifts (CLS) on mobile
const AdPlaceholder = () => (
    <div className="w-full h-48 bg-gray-100 rounded-lg animate-pulse mb-4" />
);

function Homepage() {
    const [posts, setPosts] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    // New state to separate initial page load from scrolling load
    const [isInitialLoad, setIsInitialLoad] = useState(true);

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
            // Turn off initial load after the first fetch finishes
            if (isFirstLoad) {
                setIsInitialLoad(false);
            }
        }
    };

    useEffect(() => {
        fetchPosts(true);
    }, []);

    useEffect(() => {
        if (inView && hasMore && !loading) {
            fetchPosts();
        }
    }, [inView, hasMore, loading]);

    const randomProducts = ProductsCatalog();

    return (
        <div className="flex justify-between items-start py-5 feed-layout min-h-screen">
            <Suspense fallback={<div className="hidden lg:block w-64 h-screen" />}>
                <LeftSidebar />
            </Suspense>
            
            <div className="w-full md:px-4 flex flex-col justify-center items-center feed-container max-w-2xl">
                <CreatePost />

                {posts.map((post, index) => {
                    const showAdsRow = (index + 1) % 5 === 0;

                    return (
                        <React.Fragment key={post.id}>
                            {/* Priority true tells the images inside the first posts to load instantly */}
                            <PostCard postId={post.id} priority={index < 2} />

                            {showAdsRow && randomProducts.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-h-50">
                                    {randomProducts.map((product) => (
                                        <Suspense key={`ad-${post.id}-${product.id}`} fallback={<AdPlaceholder />}>
                                            <AmazonAdds
                                                imageUrl={product.imageUrl}
                                                linkUrl={product.linkUrl}
                                                title={product.title}
                                                description={product.description}
                                                price={product.price}
                                                shoplink={product.shoplink}
                                            />
                                        </Suspense>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}

                <div ref={ref} className="w-full py-10 flex justify-center min-h-20">
                    {/* Quietly wait during the initial load so text doesn't flash */}
                    {loading && isInitialLoad && (
                        <div className="w-full h-10 bg-gray-50 rounded animate-pulse" />
                    )}

                    {/* Show this text only when the user is scrolling for more posts */}
                    {loading && !isInitialLoad && (
                        <div className="text-gray-400 animate-pulse">Loading more posts...</div>
                    )}
                    
                    {!hasMore && posts.length > 0 && (
                        <p className="text-gray-400">You've reached the end!</p>
                    )}
                </div>
            </div>
            
            <Suspense fallback={<div className="hidden lg:block w-64 h-screen" />}>
                <RightSidebar />
            </Suspense>
        </div>
    );
}

export default Homepage;
