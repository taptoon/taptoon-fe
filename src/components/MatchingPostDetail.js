import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, Typography, Box, Button, ImageList, ImageListItem } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './MatchingPostDetail.css';
import { jwtDecode } from 'jwt-decode'; // named import로 수정

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function MatchingPostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        const response = await fetch(`http://localhost:8080/matching-posts/${id}`);
        if (!response.ok) throw new Error('게시글 상세 정보를 불러오지 못했습니다.');
        const result = await response.json();
        if (result.success_or_fail) {
          setPost(result.data);
        } else {
          throw new Error(result.message || '데이터 로드 실패');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPostDetail();
  }, [id]);

  // 현재 로그인한 유저의 ID 추출 (JWT 토큰에서)
  const getCurrentUserId = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return null;
    }
    try {
      const decodedToken = jwtDecode(accessToken);
      return decodedToken.sub ? parseInt(decodedToken.sub, 10) : null; // JWT의 subject(sub)에서 사용자 ID 추출
    } catch (error) {
      console.error('JWT 디코딩 실패:', error);
      return null;
    }
  };

  // 채팅 이동 핸들러 (현재 유저 ID와 receiverId 비교 및 로그인 상태 확인)
  const handleChatClick = () => {
    const currentUserId = getCurrentUserId();
    const receiverId = post.author_id;

    if (!currentUserId) {
      navigate('/login'); // 로그인하지 않은 경우 로그인 페이지로 이동
      return;
    }

    if (!receiverId) {
      setError('수신자 ID를 가져오지 못했습니다.');
      return;
    }

    if (currentUserId === receiverId) {
      alert('자기 자신에게는 채팅을 보낼 수 없습니다.');
      return;
    }

    navigate(`/chat/${post.matching_post_id}?receiverId=${receiverId}`);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  const dummyImages = [
    'https://github.com/user-attachments/assets/609850fc-d231-49b4-91ad-fa53c06cfe46',
    'https://github.com/user-attachments/assets/bf669064-02d5-48a0-965e-e4fb1c05af3a',
    'https://github.com/user-attachments/assets/79f6244e-8cf3-4a40-afa6-e311e01cf65e',
    'https://github.com/user-attachments/assets/92f2c109-95ac-4a60-94da-0049b4a2992c'
  ];

  // 현재 유저가 게시글 작성자인지 확인
  const isCurrentUserAuthor = () => {
    const currentUserId = getCurrentUserId();
    return currentUserId === post.author_id;
  };

  return (
      <ThemeProvider theme={theme}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, mb: 4 }}>
            <CardHeader
                title={post.title}
                subheader={`${post.artist_type}, ${post.work_type}`}
                sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: 2 }}
            />
            <CardContent sx={{ padding: 3 }}>
              <Typography variant="body1" color="text.primary" paragraph sx={{ mb: 2 }}>
                {post.description}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                조회수: {post.view_count} | 작성일: {new Date(post.created_at).toLocaleString()} | 수정일: {new Date(post.updated_at).toLocaleString()}
              </Typography>
              <ImageList sx={{ width: '100%', height: 300, mb: 4 }} cols={3} rowHeight={150}>
                {dummyImages.map((img, index) => (
                    <ImageListItem key={index}>
                      <img
                          src={img}
                          alt={`임시 이미지 ${index + 1}`}
                          loading="lazy"
                          onError={(e) => { e.target.src = 'https://picsum.photos/300/200?text=Error'; }}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </ImageListItem>
                ))}
              </ImageList>
              {!isCurrentUserAuthor() && ( // 작성자가 아니면 채팅 버튼 표시
                  <Button
                      variant="contained"
                      color="primary"
                      startIcon={<ChatIcon />}
                      onClick={handleChatClick}
                      sx={{ mt: 2, backgroundColor: '#ff6f61', '&:hover': { backgroundColor: '#e65b50' } }}
                  >
                    채팅으로 이동
                  </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
  );
}

export default MatchingPostDetail;