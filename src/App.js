import {Routes, Route} from 'react-router-dom';
import MatchingPostBoard from './components/MatchingPostBoard';
import MatchingPostCreate from './components/MatchingPostCreate';
import MyProfile from './components/MyProfile';
import MatchingPostDetail from './components/MatchingPostDetail'; // 새로 추가
import ChatRoom from './components/ChatRoom';
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage"; // 새로 추가

function App() {
    return (
        <div style={{padding: '20px'}}>
            <h1>Taptoon</h1>
            <Routes>
                <Route path="/" element={<MatchingPostBoard/>}/>
                <Route path="/create" element={<MatchingPostCreate/>}/>
                <Route path="/profile" element={<MyProfile/>}/>
                <Route path="/matching-posts/:id" element={<MatchingPostDetail/>}/>
                <Route path="/chat/:matchingPostId" element={<ChatRoom/>}/>
                <Route path="/login" element={<LoginPage/>}/> {/* 로그인 페이지로 변경 */}
                <Route path="/signup" element={<SignupPage/>}/> {/* 회원가입 페이지 유지 */}
            </Routes>
        </div>
    );
}

export default App;