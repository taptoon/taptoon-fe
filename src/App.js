import { Routes, Route } from 'react-router-dom';
import MatchingPostBoard from './components/MatchingPostBoard';
import MatchingPostCreate from './components/MatchingPostCreate';
import MyProfile from './components/MyProfile';
import MatchingPostDetail from './components/MatchingPostDetail'; // 새로 추가
import ChatRoom from './components/ChatRoom'; // 새로 추가

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Taptoon 게시판</h1>
      <Routes>
        <Route path="/" element={<MatchingPostBoard />} />
        <Route path="/create" element={<MatchingPostCreate />} />
        <Route path="/profile" element={<MyProfile />} />
        <Route path="/matching-posts/:id" element={<MatchingPostDetail />} />
        <Route path="/chat/:matchingPostId" element={<ChatRoom />} />
      </Routes>
    </div>
  );
}

export default App;