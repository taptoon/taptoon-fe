// Signup.js
import React, { useState } from 'react';
import { Container, TextField, Button, Box, Typography, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // 비밀번호 유효성 검사 정규식 (영문자, 숫자, 특수문자 각각 1개 이상, 최소 8자)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(''); // 에러 초기화

        // 클라이언트 측 유효성 검사
        if (!email || !password || !nickname || !name) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (!passwordRegex.test(password)) {
            setError('비밀번호는 영문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.');
            return;
        }

        // 백엔드 API 호출
        try {
            const response = await fetch(`http${process.env.REACT_APP_API_URL}/auth/sign-up`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nickname, name }),
            });
            const data = await response.json();

            if (!response.ok) {
                // 에러 메시지를 alert로 표시
                alert(data.message || '회원가입에 실패했습니다.');
                setError(data.message || '회원가입에 실패했습니다.');
                return;
            }

            // 회원가입 성공 시 로그인 페이지로 이동
            navigate('/login');
        } catch (err) {
            alert('회원가입 중 오류가 발생했습니다: ' + (err.message || '네트워크 문제 또는 서버 오류'));
            setError('회원가입 중 오류가 발생했습니다.');
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    return (
        <Container maxWidth="sm" sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>회원가입</Typography>
            <Box component="form" onSubmit={handleSignup} sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="닉네임"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    required
                />
                <FormControl fullWidth variant="outlined" margin="normal" required>
                    <InputLabel htmlFor="outlined-adornment-password">비밀번호</InputLabel>
                    <OutlinedInput
                        id="outlined-adornment-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                        label="비밀번호"
                    />
                </FormControl>
                {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                    회원가입
                </Button>
                <Button variant="text" onClick={() => navigate('/login')} sx={{ mt: 1 }}>
                    이미 계정이 있나요? 로그인
                </Button>
            </Box>
        </Container>
    );
}

export default SignupPage;