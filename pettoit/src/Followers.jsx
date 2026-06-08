import { Link } from 'react-router';
import FollowButton from './FollowButton';
import defaultAvatar from './assets/dog-paw-print.png';

const FollowerItem = ({ follower, myUid, myUsername, myProfilePic }) => {
  
  const { username, profilePic, uid } = follower;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {/* Profile Pic */}
        <Link to={`/profile/${username}`}>
          <img 
            src={profilePic || defaultAvatar} 
            alt={username} 
            className="w-12 h-12 rounded-full object-cover border border-gray-200"
          />
        </Link>

        {/* Username */}
        <div className="flex flex-col">
          <Link 
            to={`/profile/${username}`} 
            className="font-bold text-gray-800 hover:underline"
          >
            @{username || 'Anonymous'}
          </Link>
          <span className="text-xs text-gray-500">Pet Lover</span>
        </div>
      </div>

      <FollowButton 
        myUid={myUid}
        myUsername={myUsername}
        myProfilePic={myProfilePic}
        targetUid={uid} 
        targetUsername={username}
        targetProfilePic={profilePic}
      />
    </div>
  );
};

export default FollowerItem;
