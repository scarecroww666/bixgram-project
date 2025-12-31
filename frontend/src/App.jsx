import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [userData, setUserData] = useState(null)
  const [viewedProfile, setViewedProfile] = useState(null)
  const [currentView, setCurrentView] = useState('feed')
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', location: '', bio: ''
  })
  const [postText, setPostText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  /** @type {[Array<{sender_username: string, receiver_username: string, text: string, timestamp: string}>, Function]} */
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // Для выбора конкретного собеседника

  const API_BASE = 'http://127.0.0.1:8000';

  // 1. ОТПРАВКА СООБЩЕНИЙ
  const sendMessage = async () => {
    if (!postText || !postText.trim()) return;

    let receiverId = null;

    if (viewedProfile) {
      receiverId = viewedProfile.user || viewedProfile.id;
    }
    else if (selectedChat) {
      receiverId = selectedChat.user_id || selectedChat.id;
    }

    console.log("DEBUG: ATTEMPTING_SEND", { to: receiverId, text: postText });

    if (!receiverId) {
      alert("SYSTEM_ERROR: TARGET_NOT_SPECIFIED");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          receiver: receiverId,
          text: postText
        })
      });

      if (response.ok) {
        setPostText('');
        fetchMessages();
      } else {
        const errorData = await response.json();
        console.error("SERVER_REJECTED_MESSAGE:", errorData);
        alert(`ENCRYPTION_FAILED: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("TRANSMISSION_ERROR:", error);
    }
  };

  // 2. ЗАГРУЗКА ДАННЫХ
  const fetchMyData = async (userToken) => {
    try {
      const response = await fetch(`${API_BASE}/api/me/`, {
        headers: { 'Authorization': `Token ${userToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error("DATABASE SYNC ERROR", error);
    }
  };

  const fetchMessages = async () => {
    if (!token || !userData) return;
    try {
      const response = await fetch(`${API_BASE}/api/messages/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);

        const partners = new Map();
        const myUsernameLower = userData.username.toLowerCase();

        data.forEach(m => {
          if (!m || !m.sender_username || !m.receiver_username) return;
          const sNameLower = m.sender_username.toLowerCase();
          const isMeSender = sNameLower === myUsernameLower;

          const partnerName = isMeSender ? m.receiver_username : m.sender_username;
          const partnerId = isMeSender ? m.receiver : m.sender;

          if (partnerName.toLowerCase() === myUsernameLower) return;

          const chatKey = partnerName.toLowerCase();

          if (partnerName && !partners.has(chatKey)) {
            partners.set(chatKey, {
              username: partnerName,
              user_id: partnerId
            });
          }
        });
        setChats(Array.from(partners.values()));
      }
    } catch (err) {
      console.error("SYNC_ERROR:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyData(token);
    }
  }, [token]);

  useEffect(() => {
    if (token && userData) {
      fetchMessages();
    }
  }, [token, userData]);

  // 3. ПОИСК
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      try {
        const response = await fetch(`${API_BASE}/api/profiles/?search=${query}`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        const data = await response.json();
        setSearchResults(data);
      } catch (err) {
        console.error("SEARCH ERROR", err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login/' : '/api/register/';
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        alert(JSON.stringify(data));
      }
    } catch (error) {
      console.error("AUTH ERROR", error);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserData(null);
    setViewedProfile(null);
    setPostText('');
    localStorage.removeItem('token');
  };

  if (!token) {
    return (
      <div className="auth-container">
        <h1 className="glitch-logo">Bixgram</h1>
        <form onSubmit={handleAuth} className="auth-form">
          <input type="text" placeholder="username" required value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})} />
          <input type="password" placeholder="password" required value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" className="bix-button">{isLogin ? '> LOGIN' : '> CREATE_ACCOUNT'}</button>
        </form>
        <p className="toggle-auth" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Join network" : "Already registered?"}
        </p>
      </div>
    );
  }

  return (
    <div className="terminal-container">
      <pre className="ascii-logo">
{` ______     __     __  __     ______     ______     ______     __    __    
/\\  == \\   /\\ \\   /\\_\\_\\_\\   /\\  ___\\   /\\  == \\   /\\  __ \\   /\\ "-./  \\   
\\ \\  __<   \\ \\ \\  \\/_/\\_\\/_  \\ \\ \\__ \\  \\ \\  __<   \\ \\  __ \\  \\ \\ \\-./\\ \\  
 \\ \\_____\\  \\ \\_\\   /\\_\\/\\_\\  \\ \\____\\  \\ \\_\\ \\_\\  \\ \\_\\ \\_\\  \\ \\_\\ \\ \\_\\ 
  \\/_____/   \\/_/   \\/_/\\/_/   \\/_____/   \\/_/ /_/   \\/_/\\/_/   \\/_/  \\/_/ `}
      </pre>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="search-box-wrapper" style={{ padding: '10px', borderBottom: '1px solid #00ff00' }}>
            <input
                type="text"
                placeholder="[ FIND_AGENT ]"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="terminal-input"
            />
            {searchResults.length > 0 && (
              <div className="search-results-overlay">
                {searchResults.map((p, i) => (
                  <div key={i} className="search-item" onClick={() => {
                    setPostText('');
                    setViewedProfile(p);
                    setCurrentView('profile');
                    setSearchQuery('');
                    setSearchResults([]);
                  }}>
                    {`> ${p.username?.toUpperCase()}`}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/*разделы в сайдбаре*/}
          <nav>
            <div className={`nav-item ${currentView === 'feed' ? 'active' : ''}`}
                 onClick={() => {
                   setPostText('');
                   setViewedProfile(null);
                   setCurrentView('feed');
                 }}
            >
              { "[ # ] CENTRAL_FEED" }
            </div>
            <div className={`nav-item ${currentView === 'profile' && !viewedProfile ? 'active' : ''}`}
                 onClick={() => {
                   setPostText('');
                   setViewedProfile(null);
                   setCurrentView('profile');
                 }}
            >
              { "[ @ ] MY_DOSSIER" }
            </div>
            <div className={`nav-item ${currentView === 'chats' ? 'active' : ''}`}
                 onClick={() => {
                   setPostText('');
                   setViewedProfile(null);
                   setCurrentView('chats');
                 }}
            >
              { "[ > ] CHATS_LOG" }
            </div>
          </nav>
          <div className="nav-spacer"></div>
          <button onClick={handleLogout} className="terminate-link">[ X ] TERMINATE</button>
        </aside>

<main className="content-area">
  {currentView === 'chats' ? (
    <div className="chats-layout" style={{ display: 'flex', gap: '20px', height: '100%' }}>
      <div className="chats-sidebar" style={{ width: '250px', borderRight: '1px solid #00ff0033' }}>
        <h3 className="terminal-header">[ ACTIVE_CHANNELS ]</h3>
        <div className="chats-list">
          {chats.length > 0 ? (
            chats.map((chat, i) => (
              <div
                key={i}
                className={`nav-item ${selectedChat === chat ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat)}
                style={{ padding: '10px', cursor: 'pointer' }}
              >
                {`> ${chat.username?.toUpperCase() || 'UNKNOWN_AGENT'}`}
              </div>
            ))
          ) : (
            <p className="system-msg" style={{ padding: '10px', opacity: 0.5 }}>[ NO_ACTIVE_CHANNELS ]</p>
          )}
        </div>
      </div>

      <div className="chat-window" style={{ flex: 1, padding: '10px' }}>
        {selectedChat ? (
          <div className="active-chat">
            <h3 style={{ borderBottom: '1px solid #00ff00' }}>[ SESSION: {selectedChat.username?.toUpperCase()} ]</h3>

            <div className="messages-stream" style={{ height: '300px', overflowY: 'auto', marginBottom: '20px', padding: '10px' }}>
              {messages.length > 0 && selectedChat ? (
                  messages
                      .filter(m => {
                        const activePartner = String(selectedChat.username || "").trim().toLowerCase();
                        const mSender = String(m.sender_username || "").trim().toLowerCase();
                        const mReceiver = String(m.receiver_username || "").trim().toLowerCase();

                        return mSender === activePartner || mReceiver === activePartner;
                      })
                  .map((msg, i) => (
                      <div key={i} className="message-line" style={{ marginBottom: '10px', borderLeft: '2px solid #00ff0033', paddingLeft: '8px' }}>
                        <span style={{ color: '#00ff0066', fontSize: '0.8rem' }}>
                          [{new Date(msg.timestamp).toLocaleTimeString()}]
                        </span>
                        <span style={{
                          color: String(msg.sender_username).toLowerCase() === String(userData?.username).toLowerCase() ? '#00ff00' : '#888',
                          fontWeight: 'bold'
                        }}>
                          {` ${msg.sender_username?.toUpperCase()}: `}
                        </span>
                        <span style={{ color: '#fff' }}>{msg.text}</span>
                      </div>
                  ))
              ) : (
                  <p style={{ opacity: 0.5, textAlign: 'center', marginTop: '20px' }}>
                    {selectedChat ? "[ NO_MESSAGES_IN_THIS_CHANNEL ]" : "[ DECRYPTING_STREAM... ]"}
                  </p>
              )}
            </div>
            <div className="reply-box" style={{ borderTop: '1px solid #00ff0033', paddingTop: '10px' }}>
              <textarea
                className="terminal-input"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="REPLY_TO_ENCRYPTED_CHANNEL..."
                style={{ width: '100%', minHeight: '60px', marginBottom: '10px' }}
              />
                <button className="terminal-button" onClick={sendMessage}>
                    [ SEND_REPLY ]
                </button>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>
            <p>[ SELECT_CHANNEL_TO_ESTABLISH_CONNECTION ]</p>
          </div>
        )}
      </div>
    </div>

  ) : currentView === 'profile' ? (
    <div className="profile-view">
      <div className="profile-header">
        <div className="profile-avatar">
          {(viewedProfile || userData)?.avatar ? (
            <img src={(viewedProfile || userData).avatar.startsWith('http')
              ? (viewedProfile || userData).avatar
              : `${API_BASE}${(viewedProfile || userData).avatar}`} className="hacker-pfp" alt="pfp" />
          ) : <pre>{`[ PHOTO ]\n[ MISSING ]`}</pre>}
        </div>
        <div className="profile-info">
          <h2>AGENT: {(viewedProfile || userData)?.username?.toUpperCase()}</h2>
          <p>
            <strong>STATUS:</strong>
            <span className={viewedProfile ? "status-offline" : "online-pulse"}>
              {viewedProfile ? " OFFLINE" : " ONLINE"}
            </span>
          </p>
          <p>
            <strong>LOCATION:</strong>
            {(viewedProfile || userData)?.location || 'UNKNOWN'}
          </p>
        </div>
      </div>
      <div className="profile-bio">
        <p><strong>BIO_DATA:</strong></p>
        <div className="bio-text">
          {viewedProfile ? viewedProfile.bio : (userData?.bio || 'NO INTEL')}
        </div>
        {viewedProfile && (
            <div className="message-form" style={{ marginTop: '20px', borderTop: '1px solid #00ff0033', paddingTop: '15px' }}>
              <p style={{ color: '#00ff00', fontSize: '0.8rem', marginBottom: '10px' }}>
                  [ SEND_ENCRYPTED_MESSAGE_TO: {viewedProfile.username?.toUpperCase()} ]
              </p>
              <textarea
                className="terminal-input"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="ENTER_ENCRYPTED_DATA..."
                style={{ width: '100%', minHeight: '80px', marginBottom: '10px' }}
              />
              <button
                className="terminal-button"
                onClick={sendMessage}
              >
                [ EXECUTE_SEND ]
              </button>
            </div>
          )}
      </div>
    </div>
  ) : (
    <div className="feed-container">
      <h2>CENTRAL_DATA_STREAM</h2>
      <div className="messages-list">
        <div className="post-item system">
          <span className="post-author">[SYSTEM]:</span>
          <span className="post-text"> ENCRYPTION_ESTABLISHED.</span>
        </div>
      </div>
    </div>
  )}
</main>
      </div>
    </div>
  );
}

export default App;