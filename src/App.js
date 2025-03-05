import {Routes, Route, Link} from 'react-router-dom';
import MatchingPostBoard from './components/MatchingPostBoard';
import CreateMatchingPost from './components/CreateMatchingPost';
import MyProfile from './components/MyProfile';
import DetailedMatchingPost from './components/DetailedMatchingPost'; // 새로 추가
import ChatRoom from './components/ChatRoom';
import Login from './components/Login';
import SignupPage from './components/Signup';
import MyChatRoomList from './components/MyChatRoomList';
import {Typography} from "@mui/material";
import EditMatchingPost from "./components/EditMatchingPost";
import CreatePortfolio from "./components/CreatePortfolio";
import DetailedPortfolio from "./components/DetailedPortfolio";
import EditPortfolio from "./components/EditPortfolio"; // 새로 추가
import {WebSocketProvider} from "./WebSocketContext"; // 새로 추가
import {AuthProvider, useAuth} from './AuthContext';

function App() {
    const {isAuthenticated} = useAuth();

    return (
        <AuthProvider>
            <WebSocketProvider> {/* 전체 앱에 적용 */}
                <div style={{ padding: '20px' }}>
                    <Link
                        to="/"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <img
                            src="https://avatars.githubusercontent.com/u/198835479?s=200&v=4"
                            alt="Taptoon Logo"
                            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                        />
                        <Typography variant="h1" component="span" sx={{ color: '#1976d2', fontSize: '24px', margin: 0 }}>
                            Taptoon
                        </Typography>
                    </Link>
                    <Routes>
                        <Route path="/" element={<MatchingPostBoard />} />
                        <Route path="/create" element={<CreateMatchingPost />} />
                        <Route path="/profile" element={<MyProfile />} />
                        <Route path="/matching-posts/:id" element={<DetailedMatchingPost />} />
                        <Route path="/chat/:chatRoomId" element={<ChatRoom />} />
                        <Route path="/chat" element={<ChatRoom />} />
                        <Route path="/chat-rooms" element={<MyChatRoomList />} />
                        <Route path="/edit-matching-post/:id" element={<EditMatchingPost />} />
                        <Route path="/portfolios/create" element={<CreatePortfolio />} />
                        <Route path="/portfolios/:portfolioId" element={<DetailedPortfolio />} />
                        <Route path="/portfolios/:portfolioId/edit" element={<EditPortfolio />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="*" element={<Login />} />
                    </Routes>
                </div>
            </WebSocketProvider>
        </AuthProvider>
    );
}

export default App;