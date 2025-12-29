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

  const API_BASE = 'http://127.0.0.1:8000';

  // 1. ОТПРАВКА СООБЩЕНИЙ
  const sendMessage = async () => {
    if (!postText.trim()) return;
    const receiverId = viewedProfile?.user;
    try {
      const response = await fetch(`${API_BASE}/api/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ receiver: receiverId, text: postText })
      });
      if (response.ok) {
        alert("MESSAGE_SENT: ENCRYPTION_SUCCESSFUL");
        setPostText('');
      } else {
        const errorData = await response.json();
        console.error("SERVER_ERROR:", errorData);
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

  useEffect(() => {
    if (token) fetchMyData(token)
  }, [token])

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

          <nav>
            <div className={`nav-item ${currentView === 'feed' ? 'active' : ''}`}
                 onClick={() => { setPostText(''); setViewedProfile(null); setCurrentView('feed'); }}>[ # ] CENTRAL_FEED</div>
            <div className={`nav-item ${currentView === 'profile' && !viewedProfile ? 'active' : ''}`}
                 onClick={() => { setPostText(''); setViewedProfile(null); setCurrentView('profile'); }}>[ @ ] MY_DOSSIER</div>
          </nav>
          <div className="nav-spacer"></div>
          <button onClick={handleLogout} className="terminate-link">[ X ] TERMINATE</button>
        </aside>

        <main className="content-area">
          {currentView === 'profile' ? (
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
                    <strong>
                      STATUS:
                    </strong>
                    <span className={viewedProfile ? "status-offline" : "online-pulse"}
                    >
                      {viewedProfile ? " OFFLINE" : " ONLINE"}
                    </span>
                  </p>
                  <p>
                    <strong>
                      LOCATION:
                    </strong>
                    {(viewedProfile || userData)?.location || 'UNKNOWN'}
                  </p>
                </div>
              </div>
              <div className="profile-bio">
                <p>
                  <strong>
                    BIO_DATA:
                  </strong>
                </p>
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
                        onClick={() => handleSendMessage(viewedProfile.user)}
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