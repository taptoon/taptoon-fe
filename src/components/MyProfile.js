import { useState, useEffect } from 'react'; // useEffect 추가로 API 호출
import { Box, Typography, Button, Fab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat'; // 채팅 아이콘 추가 (MUI에서 제공)

function MyProfile() {
  const [user, setUser] = useState(null); // 사용자 데이터를 상태로 관리
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 사용자 정보 API 호출
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken'); // accessToken 가져오기
        if (!accessToken) {
          throw new Error('로그인 정보가 없습니다. 로그인 후 이용해주세요.');
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/members`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`, // accessToken을 Bearer 토큰으로 헤더에 포함
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('사용자 정보를 가져오지 못했습니다.');
        }

        const result = await response.json();
        if (result.success_or_fail) { // snake_case로 수정: success_or_fail
          setUser({
            email: result.data.email, // 이메일로 매핑
            name: result.data.name, // 이름으로 매핑
            nickname: result.data.nickname, // 닉네임으로 매핑
            grade: result.data.grade, // 사용자 정보로 매핑
            created_at: result.data.created_at, // 계정 가입일시로 매핑
            updated_at: result.data.updated_at, // 마지막 수정일시로 매핑
          });
        } else {
          throw new Error(result.message || '사용자 정보 로드 실패');
        }
      } catch (err) {
        setError(err.message);
        if (err.message.includes('로그인')) {
          navigate('/login'); // accessToken이 없으면 로그인 페이지로 리디렉션
        } else {
          // 토큰이 유효하지 않거나 만료된 경우에도 로그인 페이지로 리디렉션
          localStorage.removeItem('accessToken'); // 토큰 삭제
          localStorage.removeItem('refreshToken'); // refreshToken도 삭제
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]); // navigate를 의존성에 추가

  // 로그아웃 처리 함수 (백엔드 API 호출 추가)
  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken'); // accessToken 가져오기
      if (accessToken) {
        // 백엔드 /auth/logout API 호출 (POST 요청)
        await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`, // accessToken을 헤더에 포함
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (err) {
      console.error('로그아웃 요청 중 오류 발생:', err); // 에러 로깅 (선택적)
      // API 호출 실패 시에도 진행 (반환값이 없으므로 무시)
    } finally {
      // localStorage에서 토큰 삭제
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/'); // 메인 페이지로 이동
    }
  };

  // 내 채팅방으로 이동
  const handleGoToChatRooms = () => {
    navigate('/chat-rooms'); // 채팅방 리스트 페이지로 이동
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>오류: {error}</div>;
  if (!user) return <div>사용자 정보를 찾을 수 없습니다.</div>;

  return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
        <Typography variant="h4" gutterBottom>내 프로필</Typography>
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6">이름: {user.name}</Typography>
          <Typography>닉네임: {user.nickname}</Typography>
          <Typography>이메일: {user.email}</Typography>
          <Typography>사용자 정보: {user.grade}</Typography>
          <Typography>계정 가입일시: {new Date(user.created_at).toLocaleString()}</Typography>
          <Typography>마지막 수정일시: {new Date(user.updated_at).toLocaleString()}</Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={() => navigate('/')}>
              홈으로 돌아가기
            </Button>
            <Button variant="contained" color="secondary" onClick={handleLogout}>
              로그아웃
            </Button>
          </Box>
        </Box>

        {/* 오른쪽 하단 플로팅 버튼 */}
        <Fab
            color="primary"
            onClick={handleGoToChatRooms}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              backgroundColor: '#1976d2', // 파란색
              '&:hover': {
                backgroundColor: '#1565c0', // 호버 시 색상 변화
              },
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              borderRadius: '50%',
              width: 60,
              height: 60,
              zIndex: 1000,
              animation: 'pulse 2s infinite', // 애니메이션 추가
            }}
        >
          <ChatIcon sx={{ fontSize: 30 }} />
        </Fab>

        {/* 애니메이션 스타일 (CSS로 추가) */}
        <style>
          {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
        </style>
      </div>
  );
}

export default MyProfile;