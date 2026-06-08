import { useEffect, useState } from 'react';
import { db } from "./firebase";
import { doc, updateDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router';

const Notification = ({ myUid }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter(n => n.read === false).length;

  useEffect(() => {
    if (!myUid) return;

    const q = query(
      collection(db, "pets", myUid, "notifications"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [myUid]);

  const markAsRead = async (notifId) => {
  if (!myUid || !notifId) return;

  try {
    // Reference to the specific notification document
    const notifRef = doc(db, "pets", myUid, "notifications", notifId);
    
    // Update only the 'read' field
    await updateDoc(notifRef, {
      read: true
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

  return (
    <div className="notification-container" style={{ position: 'relative' }}>
      {/* 1. Using a <button> for accessibility and keyboard support */}
      <button 
        className="notif-icon" 
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label={`Notifications, ${unreadCount} unread items`} // Tells screen readers the count
        aria-expanded={showDropdown} // Tells if menu is open
        aria-haspopup="true"
        style={{ 
          cursor: 'pointer', 
          background: 'none', 
          border: 'none', 
          position: 'relative',
          padding: '5px'
        }}
      >
        {/* 2. aria-hidden prevents the emoji from being read out literally */}
        <span role="img" aria-hidden="true" style={{ fontSize: '24px' }}>🔔</span>
        
        {unreadCount > 0 && (
          <span className="badge" aria-hidden="true" style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="notif-dropdown" 
          role="menu" // Defines this as a menu for accessibility
          aria-label="Notifications list"
          style={{
            position: 'absolute',
            right: 0,
            background: 'white',
            border: '1px solid #ccc',
            width: '330px',
            zIndex: 100,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {notifications.length === 0 ? (
            <div role="menuitem" style={{ padding: '10px' }}>No notifications</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                role="menuitem"
                // Announces the notification content and status to screen readers
                aria-label={`${n.fromName} followed you. ${n.read ? '' : 'Unread'}`}
                style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #eee',
                  backgroundColor: n.read ? 'transparent' : '#f0f8ff',
                  color: '#333',
                  fontSize: '14px'
                }}
              >
                <Link to={`/profile/${n.fromName}`}><strong className='text-red-600'>@{n.fromName}</strong></Link> followed you!
                {!n.read && (
    <button 
      onClick={() => markAsRead(n.id)}
      className='ml-2 bg-amber-600 text-white px-2 py-1 rounded cursor-pointer text-xs shrink-0'
    >
      Mark as read
    </button>
  )}
                  
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notification;
