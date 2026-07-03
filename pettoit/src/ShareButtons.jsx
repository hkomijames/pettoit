import { FacebookShareButton, TwitterShareButton, LinkedinShareButton, RedditShareButton, PinterestShareButton, BlueskyShareButton, FacebookIcon, TwitterIcon, LinkedinIcon, RedditIcon, PinterestIcon, BlueskyIcon,} from 'react-share';
import { useLocation } from "react-router"

function ShareButtons({ url, title, imageUrl }) {
    const location = useLocation();
    return (
        <div>
            {location.pathname !== '/' && !location.pathname.startsWith("/profile/") && (
                <button type="button" className="bg-[#1A365D] hover:bg-[#0F2A4D] text-white font-bold py-2 px-4 rounded w-full cursor-pointer">
                Share
            </button>
            )}
            
            <div className="mt-4 flex flex-wrap">
                
                <FacebookShareButton url={url} hashtag={`#${title.replace(/\s+/g, '')}`} className="mx-2">
                    <FacebookIcon size={32} round />
                </FacebookShareButton>

                <TwitterShareButton url={url} title={title} className="mx-2">
                    <div style={{
    width: '32px',
    height: '32px',
    backgroundColor: '#000000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <svg 
      viewBox="0 0 24 24" 
      style={{ width: '16px', height: '16px', fill: '#FFFFFF' }}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  </div>
                </TwitterShareButton>

                <LinkedinShareButton url={url} title={title} className="mx-2">
                    <LinkedinIcon size={32} round />
                </LinkedinShareButton>

                <RedditShareButton url={url} title={title} className="mx-2">
                    <RedditIcon size={32} round />
                </RedditShareButton>

                {/* Pinterest absolute requirements: url, media, and description */}
                <PinterestShareButton url={url} media={imageUrl} description={title} className="mx-2">
                    <PinterestIcon size={32} round />
                </PinterestShareButton>

                {/* Bluesky utilizes 'title' for post composition text */}
                <BlueskyShareButton url={url} title={title} className="mx-2">
                    <BlueskyIcon size={32} round />
                </BlueskyShareButton>
            </div>
        </div>
    );
}

export default ShareButtons;