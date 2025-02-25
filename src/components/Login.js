// Login.js
import React, { useState, useEffect } from 'react'; // useEffect 추가
import { Container, TextField, Button, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google'; // Google 아이콘 (MUI에서 제공)
import { useNavigate, useSearchParams } from 'react-router-dom'; // useSearchParams 추가

// Naver 아이콘은 커스텀 이미지로 대체 가능 (예: import NaverIcon from './naver-icon.png')
const NaverIcon = () => (
    <svg width="24" height="24" fill="green"> {/* 간단한 Naver 로고 예시 */}
        <rect width="24" height="24" fill="green" />
        <text x="50%" y="50%" fill="white" textAnchor="middle" alignmentBaseline="middle">N</text>
    </svg>
);

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // URL 쿼리 파라미터 가져오기

    // 일반 로그인 처리 (기존 로직 유지)
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8080/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) throw new Error('로그인 실패');
            const result = await response.json();
            console.log(`data=${result}`);
            console.log(`accessToken=${result.data.access_token}, refreshToken=${result.data.refresh_token}`);

            const accessToken = result.data.access_token.replace(/^Bearer\s+/i, ''); // 'Bearer ' 제거
            const refreshToken = result.data.refresh_token.replace(/^Bearer\s+/i, ''); // 'Bearer ' 제거

            localStorage.setItem('accessToken', accessToken); // 토큰 저장
            localStorage.setItem('refreshToken', refreshToken);
            navigate('/');
        } catch (err) {
            setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.');
        }
    };

    // 네이버 OAuth 로그인 시작 (리디렉션)
    const handleNaverLogin = () => {
        window.location.href = 'http://localhost:8080/auth/naver/login'; // 네이버 OAuth 로그인 URL로 리디렉션
    };

    // Google OAuth 로그인 (기존 로직 유지)
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8080/auth/google/login'; // Google OAuth 로그인 URL로 리디렉션
    };

    // 회원가입 이동 (기존 로직 유지)
    const handleSignupClick = () => {
        navigate('/signup'); // 회원가입 페이지로 이동
    };

    // 네이버 OAuth 콜백 처리 (쿼리 파라미터로 토큰 받음)
    useEffect(() => {
        const accessToken = searchParams.get('access_token'); // 쿼리 파라미터에서 access_token 가져오기
        const refreshToken = searchParams.get('refresh_token'); // 쿼리 파라미터에서 refresh_token 가져오기

        if (accessToken && refreshToken) {
            try {
                const cleanAccessToken = accessToken.replace(/^Bearer\s+/i, ''); // 'Bearer ' 제거
                const cleanRefreshToken = refreshToken.replace(/^Bearer\s+/i, ''); // 'Bearer ' 제거

                localStorage.setItem('accessToken', cleanAccessToken); // 토큰 저장
                localStorage.setItem('refreshToken', cleanRefreshToken);
                navigate('/'); // 메인 페이지로 이동
            } catch (err) {
                setError('네이버 로그인 토큰 처리 중 오류가 발생했습니다.');
                console.error('Naver OAuth token error:', err);
            }
        }
    }, [searchParams, navigate]); // searchParams와 navigate를 의존성에 추가

    return (
        <Container maxWidth="sm" sx={{ p: 4 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
                <Typography variant="h4" gutterBottom>로그인</Typography>
                <IconButton
                    onClick={() => navigate('/')} // 뒤로 가기 (메인 페이지로)
                    sx={{ position: 'absolute', top: 0, right: 0 }}
                    aria-label="닫기"
                >
                    <CloseIcon />
                </IconButton>
            </Box>
            <Box sx={{ p: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<NaverIcon />}
                    onClick={handleNaverLogin}
                    sx={{ mb: 2, backgroundColor: '#03C75A', '&:hover': { backgroundColor: '#02B44E' }, width: '100%' }}
                >
                    Naver로 로그인
                </Button>
                <Button
                    variant="contained"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleLogin}
                    sx={{ mb: 2, backgroundColor: '#FFFFFF', color: '#000000', border: '1px solid #ccc', '&:hover': { backgroundColor: '#F5F5F5' }, width: '100%' }}
                >
                    Google로 로그인
                </Button>
                <Typography variant="body2" sx={{ textAlign: 'center', mb: 2 }}>
                    또는
                </Typography>
                <TextField
                    fullWidth
                    label="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="비밀번호"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    required
                />
                {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
                <Button variant="contained" color="primary" onClick={handleLogin} sx={{ mt: 2, width: '100%' }}>
                    로그인
                </Button>
                <Button variant="text" onClick={handleSignupClick} sx={{ mt: 1, width: '100%' }}>
                    회원가입
                </Button>
            </Box>
        </Container>
    );
}

export default Login;