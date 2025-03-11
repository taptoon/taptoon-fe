import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Box, Typography, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAdd from '@mui/icons-material/PersonAdd'; // 회원가입 아이콘
import CheckCircle from '@mui/icons-material/CheckCircle'; // 중복 체크 아이콘
import { useNavigate } from 'react-router-dom';

function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isEmailChecked, setIsEmailChecked] = useState(false);
    const [isEmailDuplicated, setIsEmailDuplicated] = useState(true);
    const navigate = useNavigate();

    // 이메일 유효성 검사 정규식
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // 비밀번호 유효성 검사 정규식 (영문자, 숫자, 특수문자 각각 1개 이상, 최소 8자)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    // 이메일 중복 체크 함수
    const checkEmailDuplication = async () => {
        if (!email) {
            setError('이메일을 입력해주세요.');
            return;
        }

        if (!emailRegex.test(email)) {
            alert('유효한 이메일 형식이 아닙니다. (예: user@example.com)');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/check-email-duplicated`, { // 경로 수정
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || '이메일 중복 체크에 실패했습니다.');
                return;
            }

            setIsEmailDuplicated(data.data);
            setIsEmailChecked(true);
            setError(data.data ? '이미 사용 중인 이메일입니다.' : '');
        } catch (err) {
            setError('이메일 중복 체크 중 오류가 발생했습니다: ' + (err.message || '네트워크 문제'));
        }
    };

    useEffect(() => {
        setIsEmailChecked(false);
        setIsEmailDuplicated(true);
        setError('');
    }, [email]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !nickname || !name) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (!passwordRegex.test(password)) {
            setError('비밀번호는 영문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.');
            return;
        }

        if (!isEmailChecked) {
            setError('이메일 중복 체크를 먼저 진행해주세요.');
            return;
        }

        if (isEmailDuplicated) {
            setError('이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/sign-up`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nickname, name }),
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.message || '회원가입에 실패했습니다.');
                setError(data.message || '회원가입에 실패했습니다.');
                return;
            }

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
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                        fullWidth
                        label="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                    />
                    <Button
                        variant="contained"
                        color="warning" // 주황색
                        onClick={checkEmailDuplication}
                        sx={{ mt: 2, height: '56px' }}
                        startIcon={<CheckCircle />} // 중복 체크 아이콘
                        disabled={!emailRegex.test(email)} // 이메일 양식 불일치 시 비활성화
                    >
                        중복 체크
                    </Button>
                </Box>
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
                <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 2, backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45a049' } }} // 초록색
                    disabled={!isEmailChecked || isEmailDuplicated}
                    startIcon={<PersonAdd />} // 회원가입 아이콘
                >
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