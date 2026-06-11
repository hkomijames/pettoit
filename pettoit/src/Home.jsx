import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { db } from "./firebase";
import React from "react";
import { collection, query, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { useInView } from "react-intersection-observer"; // npm install react-intersection-observer
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import AmazonAdds from "./AmazonAdds";
import dogBrush from "./assets/dogBrush.jpg";
import petTag from "./assets/petTag.jpg";
import dogBedCover from "./assets/dogBedCover.jpg";
import dogCollar from "./assets/dogCollar.jpg";
import eyeComb from "./assets/eyeComb.jpg";
import facialShampoo from "./assets/facialShampoo.jpg";
import catTree from "./assets/catTree.jpg";
import catTree1 from "./assets/catTree1.jpg";
import catToy from "./assets/catToy.jpg";

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

    {/*Amazon Affiliate Products*/}
    const products = [
        {
            id: 1,
            imageUrl: dogBrush,
            linkUrl: "https://amzn.to/445o1vT",
            title: "Deshedding Grooming Tool for Dogs & Cats",
            description: "Reduces shedding up to 90% with regular use. Perfect for dogs with medium to long hair.",
            price: 14.99,
            shoplink: "https://amzn.to/445o1vT"
        },
        {
            id: 2,
            imageUrl: petTag,
            linkUrl: "https://amzn.to/4upm2xi",
            title: "Pet Dwelling QR Code Pet ID Tag",
            description: "Any finder can scan the QR code to view your pet’s profile and contact you instantly with a one-tap call.",
            price: 14.98,
            shoplink: "https://amzn.to/4upm2xi"
        },
        {
            id: 3,
            imageUrl: dogBedCover,
            linkUrl: "https://amzn.to/3S1ainh",
            title: "100% Double-Sided Waterproof Dog Bed Cover",
            description: "The dog blanket has a excellent waterproof outer layer and a TPU waterproof membrane on the inner layer, which can achieve double waterproof protection.",
            price: 29.99,
            shoplink: "https://amzn.to/3S1ainh"
        },
        {
            id: 4,
            imageUrl: dogCollar,
            linkUrl: "https://amzn.to/4emLT3c",
            title: "Inflatable Dog Cone Collar Alternative",
            description: "While wearing the BENCMATE Collar, the inflatable function and the soft outside material will let your dog wear it comfortably and",
            price: 15.99,
            shoplink: "https://amzn.to/4emLT3c"
        },
        {
            id: 5,
            imageUrl: eyeComb,
            linkUrl: "https://amzn.to/4eyYfX1",
            title: "Professional Eye Comb for Pets",
            description: "Customers find the eye comb effective at removing eye gunk and debris around the eye area, while being gentle and comfortable to use.",
            price: 8.99,
            shoplink: "https://amzn.to/4eyYfX1"
        },
        {
            id: 6,
            imageUrl: facialShampoo,
            linkUrl: "https://amzn.to/4eAiQtW",
            title: "Pet Facial Shampoo for Dogs & Cats",
            description: "Gently cleanses your pet's face and surrounding areas, removing dirt and oils without irritating the skin.",
            price: 13.99,
            shoplink: "https://amzn.to/4eAiQtW"
        },
        {
            id: 7,
            imageUrl: catTree,
            linkUrl: "https://amzn.to/4vLaCVX",
            title: "Globlazer Heavy Duty Cat Tree",
            description: "Provides a fun and engaging play environment for your indoor cat with multiple levels and scratching posts.",
            price: 99.99,
            shoplink: "https://amzn.to/4vLaCVX"
        },
        {
            id: 8,
            imageUrl: catTree1,
            linkUrl: "https://amzn.to/4aGzkOS",
            title: "Heybly Cat Tree with Toy",
            description: " Structure of the cat tree is designed according the climbing habits of cats. Two jumping platforms not only increase the active space but also help kitties and older cats to climb up and down",
            price: 39.99,
            shoplink: "https://amzn.to/4aGzkOS"
        },
        {
            id: 9,
            imageUrl: catToy,
            linkUrl: "https://amzn.to/4omuaNF",
            title: "Potaroma Cat Toys Pillows",
            description: "Our catnip kicker toys are all made of soft plush material and baby-level cotton, soft and comfortable enough for your feline friends",
            price: 8.99,
            shoplink: "https://amzn.to/4omuaNF"
        }
    ];

    const randomProducts = useMemo(() => {
    const shuffled = [...products]
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

    return shuffled;
}, [products]);
{/*Amazon Affiliate Products End*/}

    return (
        <div className="flex justify-center py-5">
            <Suspense fallback={<div className="hidden lg:block w-64" />}>
                <LeftSidebar />
            </Suspense>
            
            <div className="w-full lg:w-1/2 px-4 flex flex-col items-center">
            
    {/*<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {randomProducts.map(product => (
        <AmazonAdds
            key={product.id}
            imageUrl={product.imageUrl}
            linkUrl={product.linkUrl}
            title={product.title}
            description={product.description}
            price={product.price}
            shoplink={product.shoplink}
        />
    ))}
</div>*/}
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

