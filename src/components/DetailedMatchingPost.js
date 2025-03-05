import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, Typography, Box, ImageList, ImageListItem,
  Fab, IconButton, TextField, Button, Collapse, List, ListItem, ListItemText,
  Divider, Paper, CircularProgress
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Comment from '@mui/icons-material/Comment'; // CommentIcon 대신 Comment 사용
import ReplyIcon from '@mui/icons-material/Reply'; // ReplyIcon 유지
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './DetailedMatchingPost.css';
import { jwtDecode } from 'jwt-decode';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    green: { main: '#4CAF50' }, // 초록색 (수정 버튼용)
    red: { main: '#f44336' }, // 빨간색 (삭제 버튼용)
    purple: { main: '#9C27B0' }, // 보라색 (답글 추가 버튼용)
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            transform: 'scale(1.02)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.3s ease, transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.3s ease, transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
  },
});

function DetailedMatchingPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newReply, setNewReply] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [replyOpen, setReplyOpen] = useState({}); // 각 댓글의 답글 토글 상태
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        // 게시글 상세 정보 조회
        const postResponse = await fetch(`${process.env.REACT_APP_API_URL}/matching-posts/${id}`);
        if (!postResponse.ok) throw new Error('게시글 상세 정보를 불러오지 못했습니다.');
        const postResult = await postResponse.json();
        if (postResult.success_or_fail) {
          setPost(postResult.data);
        } else {
          throw new Error(postResult.message || '데이터 로드 실패');
        }

        // 댓글 목록 조회 (부모 댓글만)
        const commentsResponse = await fetch(`${process.env.REACT_APP_API_URL}/comments/matching-post/${id}`);
        if (!commentsResponse.ok) throw new Error('댓글 목록을 불러오지 못했습니다.');
        const commentsResult = await commentsResponse.json();
        if (commentsResult.success_or_fail) {
          setComments(commentsResult.data || []); // 데이터가 없으면 빈 배열로 초기화
        } else {
          throw new Error(commentsResult.message || '댓글 로드 실패');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();
  }, [id]);

  // 현재 로그인한 유저의 ID 추출 (JWT 토큰에서)
  const getCurrentUserId = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return null;
    try {
      const decodedToken = jwtDecode(accessToken);
      return decodedToken.sub ? parseInt(decodedToken.sub, 10) : null;
    } catch (error) {
      console.error('JWT 디코딩 실패:', error);
      return null;
    }
  };

  // 현재 유저가 댓글/답글 작성자인지 확인
  const isCurrentUserAuthor = (comment) => {
    const currentUserId = getCurrentUserId();
    return currentUserId === comment?.member_id; // snake_case 유지
  };

  // 로그인 상태 확인
  const isLoggedIn = () => {
    return !!localStorage.getItem('accessToken');
  };

  // Unauthorized 처리 (401 응답 시 로그인 페이지로 리다이렉트)
  const handleUnauthorized = (response) => {
    if (response.status === 401) {
      navigate('/login');
      return true;
    }
    return false;
  };

  // 채팅 이동 핸들러
  const handleChatClick = () => {
    const currentUserId = getCurrentUserId();
    const receiverId = post?.author_id;

    if (!currentUserId) {
      navigate('/login');
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
  const handleDelete = async (commentId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/${commentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
        });

        if (!response.ok) {
          if (handleUnauthorized(response)) return;
          throw new Error('삭제에 실패했습니다.');
        }
        if (response.status === 204) {
          alert('댓글이 성공적으로 삭제되었습니다.');
          setComments(comments.filter(comment => comment.comment_id !== commentId));
        } else {
          const result = await response.json();
          if (result.success_or_fail) {
            alert('댓글이 성공적으로 삭제되었습니다.');
            setComments(comments.filter(comment => comment.comment_id !== commentId));
          } else {
            throw new Error(result.message || '삭제 실패');
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('삭제 오류:', err);
      }
    }
  };

  // 수정 처리 함수
  const handleEdit = (comment) => {
    setEditingComment(comment.comment_id);
    setEditedContent(comment.content);
  };

  // 수정 저장 함수
  const handleSaveEdit = async (commentId, matchingPostId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/matching-post/${matchingPostId}/comment/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });

      if (!response.ok) {
        if (handleUnauthorized(response)) return;
        throw new Error('수정에 실패했습니다.');
      }
      const result = await response.json();
      if (result.success_or_fail) {
        setComments(comments.map(comment =>
            comment.comment_id === commentId ? { ...comment, content: editedContent } : comment
        ));
        setEditingComment(null);
        setEditedContent('');
      } else {
        throw new Error(result.message || '수정 실패');
      }
    } catch (err) {
      setError(err.message);
      console.error('수정 오류:', err);
    }
  };

  // 댓글 생성 함수
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/matching-post/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        if (handleUnauthorized(response)) return;
        throw new Error('댓글 생성에 실패했습니다.');
      }
      const result = await response.json();
      if (result.success_or_fail) {
        setComments([...comments, result.data]);
        setNewComment('');
      } else {
        throw new Error(result.message || '댓글 생성 실패');
      }
    } catch (err) {
      setError(err.message);
      console.error('댓글 생성 오류:', err);
    }
  };

  // 답글 생성 함수
  const handleReplySubmit = async (parentCommentId) => {
    if (!newReply[parentCommentId]?.trim()) return;

    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/reply/${parentCommentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newReply[parentCommentId] }),
      });

      if (!response.ok) {
        if (handleUnauthorized(response)) return;
        throw new Error('답글 생성에 실패했습니다.');
      }
      const result = await response.json();
      if (result.success_or_fail) {
        const updatedComments = comments.map(comment => {
          if (comment.comment_id === parentCommentId) {
            return { ...comment, replies: [...(comment.replies || []), result.data] };
          }
          return comment;
        });
        setComments(updatedComments);
        setNewReply({ ...newReply, [parentCommentId]: '' });
      } else {
        throw new Error(result.message || '답글 생성 실패');
      }
    } catch (err) {
      setError(err.message);
      console.error('답글 생성 오류:', err);
    }
  };

  // 답글 로드 함수
  const loadReplies = async (commentId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/reply/${commentId}`);
      if (!response.ok) throw new Error('답글 목록을 불러오지 못했습니다.');
      const result = await response.json();
      if (result.success_or_fail) {
        setComments(comments.map(comment =>
            comment.comment_id === commentId ? { ...comment, replies: result.data.replies || [] } : comment
        ));
      } else {
        throw new Error(result.message || '답글 로드 실패');
      }
    } catch (err) {
      setError(err.message);
      console.error('답글 로드 오류:', err);
    }
  };

  // 답글 토글 함수
  const toggleReplies = (commentId) => {
    setReplyOpen(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
    if (!replyOpen[commentId]) {
      loadReplies(commentId); // 답글 열 때만 로드
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  return (
      <ThemeProvider theme={theme}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <Card sx={{ boxShadow: 3, borderRadius: 12, mb: 4, position: 'relative' }}>
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
              {post.image_list && post.image_list.length > 0 && (
                  <ImageList sx={{ width: '100%', height: 300, mb: 4 }} cols={3} rowHeight={150}>
                    {post.image_list.map((imageObject, index) => (
                        <ImageListItem key={index}>
                          <img
                              src={imageObject.original_image_url}
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
                  <IconButton
                      color="green"
                      aria-label="edit"
                      sx={{
                        backgroundColor: theme.palette.green.main,
                        '&:hover': { backgroundColor: '#45a049', transform: 'scale(1.05)' },
                      }}
                      onClick={() => navigate(`/edit-matching-post/${id}`, { state: { post } })}
                  >
                    <EditIcon sx={{ color: '#fff' }} />
                  </IconButton>
                  <IconButton
                      color="red"
                      aria-label="delete"
                      sx={{
                        backgroundColor: theme.palette.red.main,
                        '&:hover': { backgroundColor: '#d32f2f', transform: 'scale(1.05)' },
                      }}
                      onClick={() => handleDelete(post.id)}
                  >
                    <DeleteIcon sx={{ color: '#fff' }} />
                  </IconButton>
                </Box>
            )}
          </Card>

          {/* 댓글 및 답글 섹션 */}
          <Paper sx={{ p: 2, mb: 4, borderRadius: 12, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
              댓글
            </Typography>

            {/* 댓글 입력 폼 */}
            <form onSubmit={handleCommentSubmit}>
              <Box sx={{ mb: 2, pl: 0, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="댓글을 입력하세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    sx={{ mb: 1, borderRadius: 8 }}
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<Comment />}
                    disabled={!isLoggedIn()}
                    sx={{
                      borderRadius: 16,
                      minWidth: 120,
                      fontSize: '0.875rem',
                    }}
                >
                  댓글 추가
                </Button>
              </Box>
            </form>

            {/* 댓글 목록 */}
            <List>
              {comments?.map((comment) => (
                  <Box key={comment.comment_id}>
                    <ListItem
                        sx={{
                          mb: 1,
                          borderRadius: 8,
                          backgroundColor: '#f9f9f9',
                          boxShadow: 1,
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': { transform: 'scale(1.02)', boxShadow: 2 },
                        }}
                    >
                      <ListItemText
                          primary={`${comment.member_nickname} (ID: ${comment.member_id})`}
                          secondary={
                            editingComment === comment.comment_id ? (
                                <Box sx={{ mt: 1 }}>
                                  <TextField
                                      fullWidth
                                      variant="outlined"
                                      value={editedContent}
                                      onChange={(e) => setEditedContent(e.target.value)}
                                      sx={{ mb: 1, borderRadius: 8 }}
                                  />
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        color="green"
                                        onClick={() => handleSaveEdit(comment.comment_id, comment.matching_post_id)}
                                        sx={{ borderRadius: 16 }}
                                    >
                                      저장
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => setEditingComment(null)}
                                        sx={{ borderRadius: 16 }}
                                    >
                                      취소
                                    </Button>
                                  </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {comment.content}
                                </Typography>
                            )
                          }
                          sx={{ pl: 0 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        {isCurrentUserAuthor(comment) && (
                            <>
                              <IconButton
                                  color="green"
                                  aria-label="edit-comment"
                                  sx={{
                                    backgroundColor: theme.palette.green.main,
                                    '&:hover': { backgroundColor: '#45a049', transform: 'scale(1.1)' },
                                    borderRadius: '50%',
                                  }}
                                  onClick={() => handleEdit(comment)}
                              >
                                <EditIcon sx={{ color: '#fff' }} />
                              </IconButton>
                              <IconButton
                                  color="red"
                                  aria-label="delete-comment"
                                  sx={{
                                    backgroundColor: theme.palette.red.main,
                                    '&:hover': { backgroundColor: '#d32f2f', transform: 'scale(1.1)' },
                                    borderRadius: '50%',
                                  }}
                                  onClick={() => handleDelete(comment.comment_id)}
                              >
                                <DeleteIcon sx={{ color: '#fff' }} />
                              </IconButton>
                            </>
                        )}
                        <Button
                            variant="text"
                            color="primary"
                            onClick={() => toggleReplies(comment.comment_id)}
                            sx={{
                              fontSize: '0.875rem',
                              textTransform: 'none',
                              ml: 1,
                              '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                            }}
                        >
                          {replyOpen[comment.comment_id] ? '⌃ 답글' : '⌄ 답글'}
                        </Button>
                      </Box>
                    </ListItem>

                    {/* 답글 섹션 (토글로 열림/닫힘) */}
                    <Collapse in={!!replyOpen[comment.comment_id]} sx={{ pl: 4 }}>
                      {/* 답글 목록 */}
                      {comment.replies && comment.replies.length > 0 && (
                          <List component="div" disablePadding>
                            {comment.replies.map((reply) => (
                                <ListItem
                                    key={reply.comment_id}
                                    sx={{
                                      mb: 1,
                                      borderRadius: 8,
                                      backgroundColor: '#f0f7f4',
                                      boxShadow: 1,
                                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                      '&:hover': { transform: 'scale(1.02)', boxShadow: 2 },
                                      pl: 4, // 답글은 왼쪽으로 더 밀림 (들여쓰기)
                                    }}
                                >
                                  <ListItemText
                                      primary={`${reply.member_nickname} (ID: ${reply.member_id})`}
                                      secondary={
                                        editingComment === reply.comment_id ? (
                                            <Box sx={{ mt: 1 }}>
                                              <TextField
                                                  fullWidth
                                                  variant="outlined"
                                                  value={editedContent}
                                                  onChange={(e) => setEditedContent(e.target.value)}
                                                  sx={{ mb: 1, borderRadius: 8 }}
                                              />
                                              <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    color="green"
                                                    onClick={() => handleSaveEdit(reply.comment_id, post.id)}
                                                    sx={{ borderRadius: 16 }}
                                                >
                                                  저장
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    onClick={() => setEditingComment(null)}
                                                    sx={{ borderRadius: 16 }}
                                                >
                                                  취소
                                                </Button>
                                              </Box>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                              {reply.content}
                                            </Typography>
                                        )
                                      }
                                      sx={{ pl: 0 }}
                                  />
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    {isCurrentUserAuthor(reply) && (
                                        <>
                                          <IconButton
                                              color="green"
                                              aria-label="edit-reply"
                                              sx={{
                                                backgroundColor: theme.palette.green.main,
                                                '&:hover': { backgroundColor: '#45a049', transform: 'scale(1.1)' },
                                                borderRadius: '50%',
                                              }}
                                              onClick={() => handleEdit(reply)}
                                          >
                                            <EditIcon sx={{ color: '#fff' }} />
                                          </IconButton>
                                          <IconButton
                                              color="red"
                                              aria-label="delete-reply"
                                              sx={{
                                                backgroundColor: theme.palette.red.main,
                                                '&:hover': { backgroundColor: '#d32f2f', transform: 'scale(1.1)' },
                                                borderRadius: '50%',
                                              }}
                                              onClick={() => handleDelete(reply.comment_id)}
                                          >
                                            <DeleteIcon sx={{ color: '#fff' }} />
                                          </IconButton>
                                        </>
                                    )}
                                  </Box>
                                </ListItem>
                            ))}
                          </List>
                      )}

                      {/* 답글 입력 폼 */}
                      <Box sx={{ pl: 2, mb: 2 }}>
                        <form onSubmit={(e) => { e.preventDefault(); handleReplySubmit(comment.comment_id); }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="답글을 입력하세요..."
                                value={newReply[comment.comment_id] || ''}
                                onChange={(e) => setNewReply({ ...newReply, [comment.comment_id]: e.target.value })}
                                sx={{ mb: 1, borderRadius: 8 }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="purple"
                                startIcon={<ReplyIcon />}
                                disabled={!isLoggedIn()} // 로그인 상태 확인
                                sx={{
                                  borderRadius: 16, // 둥근 모서리
                                  minWidth: 120, // 고정된 최소 너비
                                  fontSize: '0.875rem', // 텍스트 크기 줄이기
                                }}
                            >
                              답글 추가
                            </Button>
                          </Box>
                        </form>
                      </Box>
                    </Collapse>
                    <Divider sx={{ my: 1 }} />
                  </Box>
              ))}
            </List>
          </Paper>

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
                    '&:hover': { backgroundColor: '#45a049', transform: 'scale(1.05)' },
                  }}
                  onClick={handleChatClick}
              >
                <ChatIcon sx={{ color: '#fff' }} />
              </Fab>
          )}
        </div>
      </ThemeProvider>
  );
}

export default DetailedMatchingPost;