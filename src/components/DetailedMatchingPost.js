import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, Typography, Box, ImageList, ImageListItem,
  Fab, IconButton, TextField, Button, Collapse, List, ListItem, ListItemText,
  Divider, Paper
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Comment from '@mui/icons-material/Comment';
import ReplyIcon from '@mui/icons-material/Reply';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './DetailedMatchingPost.css';
import { jwtDecode } from 'jwt-decode';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    green: { main: '#4CAF50' },
    red: { main: '#f44336' },
    purple: { main: '#9C27B0' },
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
  const [replyOpen, setReplyOpen] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);

        // Matching Post 로드
        const postResponse = await fetch(`${process.env.REACT_APP_API_URL}/matching-posts/${id}`);
        if (!postResponse.ok) throw new Error('게시글 상세 정보를 불러오지 못했습니다.');
        const postResult = await postResponse.json();
        if (postResult.success_or_fail) {
          setPost(postResult.data);
        } else {
          throw new Error(postResult.message || '데이터 로드 실패');
        }

        // 댓글 리스트 로드
        const commentsResponse = await fetch(`${process.env.REACT_APP_API_URL}/comments?matchingPostId=${id}`);
        if (!commentsResponse.ok) throw new Error('댓글 목록을 불러오지 못했습니다.');
        const commentsResult = await commentsResponse.json();
        if (commentsResult.success_or_fail) {
          setComments(commentsResult.data || []);
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

  const isPostAuthor = () => {
    const currentUserId = getCurrentUserId();
    return currentUserId === post?.author_id;
  };

  const isCommentAuthor = (comment) => {
    const currentUserId = getCurrentUserId();
    return currentUserId === comment?.member_id;
  };

  const isLoggedIn = () => {
    return !!localStorage.getItem('accessToken');
  };

  const handleUnauthorized = (response) => {
    if (response.status === 401) {
      navigate('/login');
      return true;
    }
    return false;
  };

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
      setError('자기 자신에게는 채팅을 보낼 수 없습니다.');
      return;
    }

    navigate(`/chat?receiverId=${receiverId}`);
  };

  const handleCommentDeletion = async (commentId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
      });

      if (!response.ok) {
        if (handleUnauthorized(response)) return;
        throw new Error('삭제에 실패했습니다.');
      }

      if (response.status === 204) {
        setComments(prev =>
            prev
                .map(comment => ({
                  ...comment,
                  replies: comment.replies?.filter(reply => reply.comment_id !== commentId),
                }))
                .filter(comment => comment.comment_id !== commentId)
        );
      }
    } catch (err) {
      setError(err.message);
      console.error('삭제 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeletion = async () => {
    if (!window.confirm('정말 게시글을 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/matching-posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
      });

      if (!response.ok) {
        if (handleUnauthorized(response)) return;
        throw new Error('게시글 삭제에 실패했습니다.');
      }

      if (response.status === 204) {
        navigate('/'); // 삭제 후 목록 페이지로 이동 (필요에 따라 수정)
      }
    } catch (err) {
      setError(err.message);
      console.error('게시글 삭제 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingComment(comment.comment_id);
    setEditedContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/${commentId}?matchingPostId=${id}`, {
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

      if (response.status === 204) {
        setComments(prev =>
            prev.map(comment => {
              if (comment.comment_id === commentId) {
                return { ...comment, content: editedContent };
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: comment.replies.map(reply =>
                      reply.comment_id === commentId ? { ...reply, content: editedContent } : reply
                  ),
                };
              }
              return comment;
            })
        );
        setEditingComment(null);
        setEditedContent('');
      }
    } catch (err) {
      setError(err.message);
      console.error('수정 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isLoggedIn()) {
      if (!isLoggedIn()) navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments?matchingPostId=${id}`, {
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
        setComments(prev => [...prev, result.data]);
        setNewComment('');
      } else {
        throw new Error(result.message || '댓글 생성 실패');
      }
    } catch (err) {
      setError(err.message);
      console.error('댓글 생성 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (parentCommentId) => {
    if (!newReply[parentCommentId]?.trim() || !isLoggedIn()) {
      if (!isLoggedIn()) navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/${parentCommentId}`, {
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
        setComments(prev =>
            prev.map(comment =>
                comment.comment_id === parentCommentId
                    ? { ...comment, replies: [...(comment.replies || []), result.data] }
                    : comment
            )
        );
        setNewReply(prev => ({ ...prev, [parentCommentId]: '' }));
      } else {
        throw new Error(result.message || '답글 생성 실패');
      }
    } catch (err) {
      setError(err.message);
      console.error('답글 생성 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = useCallback(async (commentId) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/replies/${commentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
      });
      if (!response.ok) throw new Error('답글 목록을 불러오지 못했습니다.');
      const result = await response.json();
      if (result.success_or_fail) {
        setComments(prev =>
            prev.map(comment =>
                comment.comment_id === commentId
                    ? { ...comment, replies: result.data.replies || [] }
                    : comment
            )
        );
      } else {
        throw new Error(result.message || '답글 로드 실패');
      }
    } catch (err) {
      setError(err.message);
      console.error('답글 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleReplies = useCallback((commentId) => {
    setReplyOpen(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));

    if (!replyOpen[commentId]) {
      const commentWithReplies = comments.find(comment => comment.comment_id === commentId);
      if (!commentWithReplies?.replies || commentWithReplies.replies.length === 0) {
        loadReplies(commentId);
      }
    }
  }, [replyOpen, comments, loadReplies]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timePart = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '20px', color: '#f44336' }}>오류: {error}</div>;
  if (!post) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>게시글을 찾을 수 없습니다.</div>;

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
                조회수: {post.view_count} | 작성일: {formatDateTime(post.created_at)} | 수정일: {formatDateTime(post.updated_at)}
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

            {isPostAuthor() && (
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
                      onClick={handlePostDeletion}
                  >
                    <DeleteIcon sx={{ color: '#fff' }} />
                  </IconButton>
                </Box>
            )}
          </Card>

          <Paper sx={{ p: 2, mb: 4, borderRadius: 12, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
              댓글
            </Typography>

            <form onSubmit={handleCommentSubmit}>
              <Box sx={{ mb: 2, pl: 0, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    fullWidth
                    variant="standard"
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
                    sx={{ borderRadius: 16, minWidth: 120, fontSize: '0.875rem' }}
                >
                  댓글 추가
                </Button>
              </Box>
            </form>

            <List component="div" disablePadding>
              {comments?.map((comment) => (
                  <Box key={comment.comment_id}>
                    <ListItem
                        component="div"
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
                          primary={`${comment.member_name} (ID: ${comment.member_id}) ${formatDateTime(comment.updated_at)}`}
                          secondary={
                            editingComment === comment.comment_id ? (
                                <Box component="span" sx={{ mt: 1, display: 'block' }}>
                                  <TextField
                                      fullWidth
                                      variant="standard"
                                      value={editedContent}
                                      onChange={(e) => setEditedContent(e.target.value)}
                                      sx={{ mb: 1, borderRadius: 8 }}
                                  />
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        color="green"
                                        onClick={() => handleSaveEdit(comment.comment_id)}
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
                                <Typography component="span" variant="body2" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                  {comment.content}
                                </Typography>
                            )
                          }
                          sx={{ pl: 0 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        {isCommentAuthor(comment) && (
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
                                  onClick={() => handleCommentDeletion(comment.comment_id)}
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

                    <Collapse in={!!replyOpen[comment.comment_id]} sx={{ pl: 4 }}>
                      {comment.replies && comment.replies.length > 0 && (
                          <List component="div" disablePadding>
                            {comment.replies.map((reply) => (
                                <ListItem
                                    key={reply.comment_id}
                                    component="div"
                                    sx={{
                                      mb: 1,
                                      borderRadius: 8,
                                      backgroundColor: '#f0f7f4',
                                      boxShadow: 1,
                                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                      '&:hover': { transform: 'scale(1.02)', boxShadow: 2 },
                                      pl: 4,
                                    }}
                                >
                                  <ListItemText
                                      primary={`${reply.member_name} (ID: ${reply.member_id}) ${formatDateTime(reply.updated_at)}`}
                                      secondary={
                                        editingComment === reply.comment_id ? (
                                            <Box component="span" sx={{ mt: 1, display: 'block' }}>
                                              <TextField
                                                  fullWidth
                                                  variant="standard"
                                                  value={editedContent}
                                                  onChange={(e) => setEditedContent(e.target.value)}
                                                  sx={{ mb: 1, borderRadius: 8 }}
                                              />
                                              <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    color="green"
                                                    onClick={() => handleSaveEdit(reply.comment_id)}
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
                                            <Typography component="span" variant="body2" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                              {reply.content}
                                            </Typography>
                                        )
                                      }
                                      sx={{ pl: 0 }}
                                  />
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    {isCommentAuthor(reply) && (
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
                                              onClick={() => handleCommentDeletion(reply.comment_id)}
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

                      <Box sx={{ pl: 2, mb: 2 }}>
                        <form onSubmit={(e) => { e.preventDefault(); handleReplySubmit(comment.comment_id); }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                variant="standard"
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
                                disabled={!isLoggedIn()}
                                sx={{ borderRadius: 16, minWidth: 120, fontSize: '0.875rem' }}
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

          {!isPostAuthor() && (
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