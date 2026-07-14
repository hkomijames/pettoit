import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';
import * as fs from "fs";
import * as path from "path";
import { LRUCache } from "lru-cache"; // 🚀 Imported clean caching library

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

// 🚀 Setup clean interface structures for structural type safety
interface CachePayload {
  title: string;
  description: string;
  image: string;
  ogType: string;
  videoUrl: string;
  fetchedAt: number;
}

// Persist data maps globally. Entries are evaluated as "stale" after 5 minutes (300,000 ms)
const seoDataCache = new LRUCache<string, CachePayload>({
  max: 1000, 
  ttl: 1000 * 60 * 5,
});

export const serveApp = onRequest({ cors: true, region: "us-central1" }, async (req, res): Promise<any> => {
  const userAgent = req.get('User-Agent') || '';

  // 1. HARD BLOCK MALICIOUS BOTS
  const botBlacklist = [/sqlmap/i, /python-requests/i, /libwww-perl/i, /zgrab/i, /curl/i, /postman/i];
  const isMalicious = !userAgent || botBlacklist.some(pattern => pattern.test(userAgent));

  if (isMalicious) {
    logger.warn(`Blocking potential bot: ${userAgent}`);
    return res.status(403).send("Access Denied");
  }
  
  const url = req.path;

  // --- SITEMAP LOGIC START ---
  if (url === "/sitemap.xml") {
    try {
      const baseUrl = "https://pettoit.com";
      const [postsSnap, petsSnap] = await Promise.all([
        admin.firestore().collection("posts").select("id").get(),
        admin.firestore().collection("pets").select("username").get()
      ]);

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>${baseUrl}/</loc></url>
        <url><loc>${baseUrl}/login</loc></url>
        <url><loc>${baseUrl}/register</loc></url>
        <url><loc>${baseUrl}/about</loc></url>
        `;

      petsSnap.forEach(doc => {
        const data = doc.data();
        if (data.username) xml += `<url><loc>${baseUrl}/profile/${data.username}</loc></url>`;
      });

      postsSnap.forEach(doc => {
        xml += `<url><loc>${baseUrl}/post/${doc.id}</loc></url>`;
      });

      xml += `</urlset>`;

      res.set("Content-Type", "text/xml");
      res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
      return res.status(200).send(xml);
    } catch (error) {
      logger.error("Sitemap Error", error);
      return res.status(500).send("Error generating sitemap");
    }
  }
  // --- SITEMAP LOGIC END ---

  const pathParts = url.split("/").filter(p => p !== "");
  
  // Default fallback values
  let title = "Pettoit - Social Media for Pets";
  let description = "Register your pets (dogs, cats, birds, etc.) and connect with other pet lovers on Pettoit!, the ultimate social media platform for pets and animal enthusiasts.";
  let image = "https://firebasestorage.googleapis.com/v0/b/pettoit-1d815.firebasestorage.app/o/logo.PNG?alt=media&token=e68d9e3f-2f8e-45a4-9cd7-7e54b154e9d0";
  let ogType = "website";
  let videoUrl = "";

  try {
    if (url === "/register") {
      title = "Register your pet on Pettoit Today!";
      description = "Create a profile for your pet and connect with other pet lovers on Pettoit! Share photos, videos, and updates about your furry friend.";
    } else if (url === "/login") {
      title = "Login to Pettoit - Connect with Fellow Pet Lovers!";
      description = "Access your Pettoit account to share updates about your pets, connect with other pet owners, and explore the pet-loving community!";
    } else if (url === "/about") {
      title = "About Pettoit - The Ultimate Social Media Platform for Pets";
      description = "Learn more about Pettoit, the social media platform designed specifically for pet lovers to connect, share, and celebrate their furry friends.";
    } 
    
    // 🚀 UNIFIED SWR ENGINE PIPELINE
    else if ((pathParts[0] === "profile" && pathParts[1]) || (pathParts[0] === "post" && pathParts[1])) {
      const cacheKey = `${pathParts[0]}-${pathParts[1]}`;
      const cachedData = seoDataCache.get(cacheKey);
      const now = Date.now();

      // Core asynchronous background data resolution tracking module
      const fetchAndStoreFreshData = async () => {
        let freshTitle = title;
        let freshDesc = description;
        let freshImg = image;
        let freshType = ogType;
        let freshVid = videoUrl;

        try {
          if (pathParts[0] === "profile") {
            const username = pathParts[1];
            const userQuery = await admin.firestore().collection("pets")
              .where("username", "==", username).limit(1).get();
            
            if (!userQuery.empty) {
              const userData = userQuery.docs[0].data();
              freshTitle = `${userData.username}'s Profile | Pettoit`;
              freshDesc = `Check out ${userData.username}'s profile on Pettoit! ${userData.bio || ""}`;
            }
          } else if (pathParts[0] === "post") {
            const postId = pathParts[1];
            const postSnap = await admin.firestore().collection("posts").doc(postId).get();
            
            if (postSnap.exists) {
              const postData = postSnap.data() || {};
              let dynamicTitle = postData.content 
                ? postData.content.substring(0, 50).trim() + "..." 
                : "New Pet Post";
              freshTitle = `${dynamicTitle} | Pettoit`;
              freshDesc = postData.content ? postData.content.substring(0, 150) + "..." : description;

              if (Array.isArray(postData.imageURLs) && postData.imageURLs.length > 0) {
                freshImg = postData.imageURLs[0];
              } else if (postData.imageURL) {
                freshImg = postData.imageURL;
              } else if (postData.videoThumbnail) {
                freshImg = postData.videoThumbnail;
              }

              if (postData.videoURL) {
                freshType = "video.other";
                freshVid = postData.videoURL;
              }
            }
          }

          const freshPayload: CachePayload = {
            title: freshTitle,
            description: freshDesc,
            image: freshImg,
            ogType: freshType,
            videoUrl: freshVid,
            fetchedAt: Date.now()
          };

          seoDataCache.set(cacheKey, freshPayload);
          return freshPayload;
        } catch (err) {
          logger.error(`SWR Execution Fault on route identifier: ${cacheKey}`, err);
          return null;
        }
      };

      if (cachedData) {
        // Instant response using cached values
        title = cachedData.title;
        description = cachedData.description;
        image = cachedData.image;
        ogType = cachedData.ogType;
        videoUrl = cachedData.videoUrl;

        // If data has been in memory longer than 5 mins, quietly refresh it in the background
        if (now - cachedData.fetchedAt > 1000 * 60 * 5) {
          logger.info(`SWR Hit [STALE]: Refreshing background worker for ${cacheKey}`);
          fetchAndStoreFreshData(); // 🔥 Asynchronous background invocation
        } else {
          logger.info(`SWR Hit [FRESH]: Cache target served smoothly for ${cacheKey}`);
        }
      } else {
        // Initial Cache Miss: Fall back to a synchronous fetch to ensure scrapers see metadata
        logger.info(`SWR Miss: Synchronous fallback processing for key: ${cacheKey}`);
        const absoluteFresh = await fetchAndStoreFreshData();
        if (absoluteFresh) {
          title = absoluteFresh.title;
          description = absoluteFresh.description;
          image = absoluteFresh.image;
          ogType = absoluteFresh.ogType;
          videoUrl = absoluteFresh.videoUrl;
        }
      }
    }
  } catch (error) {
    logger.error("SEO Fetch Error", error);
  }

  const htmlPath = path.join(__dirname, "../dist/app.html"); 
  
  try {
    let html = fs.readFileSync(htmlPath, "utf8");

    // Replace all placeholders
    html = html.replace(/__TITLE__/g, title)
               .replace(/__DESCRIPTION__/g, description)
               .replace(/__IMAGE__/g, image)
               .replace(/__TYPE__/g, ogType)
               .replace(/__VIDEO_URL__/g, videoUrl);

    // CACHE CONTROL FIX: Force browsers to validate HTML structure every single time
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    
    return res.status(200).send(html);
  } catch (err) {
    logger.error("File Read Error", err);
    return res.status(500).send("Internal Server Error: Missing app.html");
  }
});
