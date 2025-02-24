import { Routes, Route, Link } from 'react-router-dom';
import MatchingPostBoard from './components/MatchingPostBoard';
import MatchingPostCreate from './components/MatchingPostCreate';
import MyProfile from './components/MyProfile';
import MatchingPostDetail from './components/MatchingPostDetail'; // 새로 추가
import ChatRoom from './components/ChatRoom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import MyChatRoomList from './components/MyChatRoomList';
import {Typography} from "@mui/material"; // 새로 추가

function App() {
    return (
        <div style={{ padding: '20px' }}>
            {/* Taptoon 로고 및 텍스트를 Link로 감싸서 /로 리다이렉션 */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                    src="https://avatars.githubusercontent.com/u/198835479?s=200&v=4"
                    alt="Taptoon Logo"
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }} // 원형 로고로 스타일링
                />
                <Typography variant="h1" component="span" sx={{ color: '#1976d2', fontSize: '24px', margin: 0 }}>
                    Taptoon
                </Typography>
            </Link>
            <Routes>
                <Route path="/" element={<MatchingPostBoard />} />
                <Route path="/create" element={<MatchingPostCreate />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="/matching-posts/:id" element={<MatchingPostDetail />} />
                <Route path="/chat/:matchingPostId" element={<ChatRoom />} />
                <Route path="/login" element={<LoginPage />} /> {/* 로그인 페이지로 변경 */}
                <Route path="/signup" element={<SignupPage />} /> {/* 회원가입 페이지 유지 */}
                <Route path="/chat-rooms" element={<MyChatRoomList />} /> {/* 내가 참여하고 있는 채팅방 목록 */}
            </Routes>
        </div>
    );
}

export default App;