import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, Typography, Box, ImageList, ImageListItem, Fab, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat'; // 채팅 아이콘
import EditIcon from '@mui/icons-material/Edit'; // 수정 아이콘
import DeleteIcon from '@mui/icons-material/Delete'; // 삭제 아이콘
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './MatchingPostDetail.css';
import { jwtDecode } from 'jwt-decode';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    green: {
      main: '#4CAF50', // 초록색 (채팅 및 수정 버튼용)
    },
    red: {
      main: '#f44336', // 빨간색 (삭제 버튼용)
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/matching-posts/${id}`);
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

  // 현재 유저가 게시글 작성자인지 확인
  const isCurrentUserAuthor = () => {
    const currentUserId = getCurrentUserId();
    return currentUserId === post?.author_id;
  };

  // 채팅 이동 핸들러 (현재 유저 ID와 receiverId 비교 및 로그인 상태 확인)
  const handleChatClick = () => {
    const currentUserId = getCurrentUserId();
    const receiverId = post?.author_id;

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

    navigate(`/chat?receiverId=${receiverId}`);
  };

  // 삭제 처리 함수
  const handleDelete = async () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/matching-posts/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          },
        });
        if (!response.ok) throw new Error('삭제에 실패했습니다.');
        const result = await response.json();
        if (result.success_or_fail) {
          alert('게시글이 성공적으로 삭제되었습니다.');
          navigate(-1); // 삭제 후 이전 페이지로 돌아감 (history.back()와 유사)
        } else {
          throw new Error(result.message || '삭제 실패');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // 수정 처리 함수 (수정 페이지로 이동, 데이터 상태로 전달)
  const handleEdit = () => {
    if (post) {
      navigate(`/edit-matching-post/${id}`, { state: { post } }); // post 데이터를 상태로 전달
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  return (
      <ThemeProvider theme={theme}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, mb: 4, position: 'relative' }}>
            <CardHeader
                title={`${post.title} (by authorId:${post.author_id})`}
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
              {/* 이미지 데이터가 있을 때만 ImageList 렌더링 */}
              {post.image_list && post.image_list.length > 0 && (
                  <ImageList sx={{ width: '100%', height: 300, mb: 4 }} cols={3} rowHeight={150}>
                    {post.image_list.map((imageObject, index) => (
                        <ImageListItem key={index}>
                          <img
                              src={imageObject.image_url}
                              alt={`이미지 ${index + 1}`}
                              loading="lazy"
                              onError={(e) => { e.target.src = 'https://picsum.photos/300/200?text=Error'; }}
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        </ImageListItem>
                    ))}
                  </ImageList>
              )}
            </CardContent>

            {/* 작성자일 때만 오른쪽 상단 끝에 수정 및 삭제 버튼 표시 */}
            {isCurrentUserAuthor() && (
                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
                  {/* 수정 버튼 (초록색) */}
                  <IconButton
                      color="green"
                      aria-label="edit"
                      sx={{
                        backgroundColor: theme.palette.green.main,
                        '&:hover': {
                          backgroundColor: '#45a049',
                          transform: 'scale(1.05)',
                        },
                      }}
                      onClick={handleEdit}
                  >
                    <EditIcon sx={{ color: '#fff' }} />
                  </IconButton>

                  {/* 삭제 버튼 (빨간색) */}
                  <IconButton
                      color="red"
                      aria-label="delete"
                      sx={{
                        backgroundColor: theme.palette.red.main,
                        '&:hover': {
                          backgroundColor: '#d32f2f',
                          transform: 'scale(1.05)',
                        },
                      }}
                      onClick={handleDelete}
                  >
                    <DeleteIcon sx={{ color: '#fff' }} />
                  </IconButton>
                </Box>
            )}
          </Card>

          {/* 작성자가 아닌 경우에만 오른쪽 하단 플로팅 채팅 버튼 표시 */}
          {!isCurrentUserAuthor() && (
              <Fab
                  color="green"
                  aria-label="chat"
                  sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    backgroundColor: '#4CAF50',
                    '&:hover': {
                      backgroundColor: '#45a049', // 호버 시 더 진한 초록색
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={handleChatClick}
              >
                <ChatIcon sx={{ color: '#fff' }} /> {/* 흰색 채팅 아이콘 */}
              </Fab>
          )}
        </div>
      </ThemeProvider>
  );
}

export default MatchingPostDetail;