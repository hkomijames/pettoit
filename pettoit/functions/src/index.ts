import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';
import * as fs from "fs";
import * as path from "path";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

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
  
  // Default values
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
    } else if (pathParts[0] === "profile" && pathParts[1]) {
      const username = pathParts[1];
      const userQuery = await admin.firestore().collection("pets")
        .where("username", "==", username).limit(1).get();
      
      if (!userQuery.empty) {
        const userData = userQuery.docs[0].data();
        title = `${userData.username}'s Profile | Pettoit`;
        description = `Check out ${userData.username}'s profile on Pettoit! ${userData.bio || ""}`;
      }
    }
    
    if (pathParts[0] === "post" && pathParts[1]) {
      const postId = pathParts[1];
      const postSnap = await admin.firestore().collection("posts").doc(postId).get();
      
      if (postSnap.exists) {
        const postData = postSnap.data() || {};
        
        // Title & Description
        let dynamicTitle = postData.content 
          ? postData.content.substring(0, 50).trim() + "..." 
          : "New Pet Post";
        title = `${dynamicTitle} | Pettoit`;
        description = postData.content ? postData.content.substring(0, 150) + "..." : description;

        // Image Selection Priority
        if (Array.isArray(postData.imageURLs) && postData.imageURLs.length > 0) {
          image = postData.imageURLs[0];
        } 
        else if (postData.imageURL) {
          image = postData.imageURL;
        }
        else if (postData.videoThumbnail) {
          image = postData.videoThumbnail;
        }

        // VIDEO LOGIC
        if (postData.videoURL) {
          ogType = "video.other";
          videoUrl = postData.videoURL;
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

    res.set("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.status(200).send(html);
  } catch (err) {
    logger.error("File Read Error", err);
    return res.status(500).send("Internal Server Error: Missing app.html");
  }
});
