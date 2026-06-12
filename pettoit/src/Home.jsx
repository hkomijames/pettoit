import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { db } from "./firebase";
import React from "react";
import { collection, query, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { useInView } from "react-intersection-observer"; // npm install react-intersection-observer
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import AmazonAdds from "./AmazonAdds";
import ProductsCatalog from "./AmazonProducts";

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
        <div className="flex justify-between items-start py-5 feed-layout">
            <Suspense fallback={<div className="hidden lg:block w-64" />}>
                <LeftSidebar />
            </Suspense>
            
            <div className="w-full px-4 flex flex-col md:w-full justify-center items-center feed-container">

                <CreatePost />

    {posts.map((post, index) => {
        const showAdsRow = (index + 1) % 5 === 0;

        return (
            <React.Fragment key={post.id}>
        
                <PostCard postId={post.id} priority={index < 3} />

                {/* 2. Every 5th post, insert the 2 random ads side-by-side */}
                {showAdsRow && randomProducts.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {randomProducts.map((product) => (
                            <AmazonAdds
                                key={`ad-${post.id}-${product.id}`}
                                imageUrl={product.imageUrl}
                                linkUrl={product.linkUrl}
                                title={product.title}
                                description={product.description}
                                price={product.price}
                                shoplink={product.shoplink}
                            />
                        ))}
                    </div>
                )}
            </React.Fragment>
        );
    })}

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

