import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './ChatRoom.css';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#ff6f61' },
    green: { main: '#4CAF50' },
  },
});

function ChatRoom() {
  const { chatRoomId } = useParams();
  const [searchParams] = useSearchParams();
  const receiverId = searchParams.get('receiverId');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const fileInputRef = useRef(null);
  const MAX_FILES = 5;
  const hasCreatedRoom = useRef(false);

  const getCurrentUserId = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return null;
    try {
      const decodedToken = jwtDecode(accessToken);
      const userId = String(decodedToken.sub);
      return userId;
    } catch (error) {
      console.error('JWT 디코딩 실패:', error);
      setError('JWT 토큰 디코딩 실패. 로그인 상태를 확인하세요.');
      return null;
    }
  };

  const parseDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? new Date() : date;
  };

  const handleWebSocketMessage = useCallback((event) => {
    try {
      const messageData = JSON.parse(event.data);
      console.log('WebSocket 메시지 수신:', JSON.stringify(messageData, null, 2));

      // 삭제된 메시지 필터링
      if (messageData.status === 'DELETED' || messageData.is_deleted) {
        console.log('삭제된 메시지 필터링 - id:', messageData.id);
        setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg.id !== messageData.id)
        );
        return;
      }

      setMessages((prevMessages) => {
        const exists = prevMessages.some((m) => m.id === (messageData.id || messageData._id));
        if (exists) {
          console.log('중복 메시지 필터링됨:', messageData.id || messageData._id);
          return prevMessages;
        }
        const senderId = messageData.sender_id || messageData.senderId;
        const newMessage = {
          id: messageData.id || messageData._id,
          room_id: messageData.chat_room_id,
          sender: senderId?.toString() === getCurrentUserId() ? '나' : '상대방',
          text: messageData.message,
          thumbnailImageUrl: messageData.thumbnail_image_url,
          originalImageUrl: messageData.original_image_url,
          type: messageData.type || (messageData.original_image_url ? 'IMAGE' : 'TEXT'),
          time: parseDate(messageData.created_at).toLocaleString(),
          unread_count: messageData.unread_count || 0,
          status: messageData.status,
          is_deleted: messageData.is_deleted || false,
        };
        console.log('새 메시지 추가:', JSON.stringify(newMessage, null, 2));
        return [...prevMessages, newMessage];
      });
    } catch (err) {
      console.error('WebSocket 메시지 파싱 실패:', err);
      setError('유효하지 않은 채팅 데이터 수신');
    }
  }, []);

  useEffect(() => {
    const setupChatRoom = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) throw new Error('로그인 정보가 없습니다. 로그인 후 이용해주세요.');

        let currentRoomId = chatRoomId || null;

        if (!currentRoomId && receiverId && !hasCreatedRoom.current) {
          hasCreatedRoom.current = true;

          const receiverIdNum = Number(receiverId);
          if (isNaN(receiverIdNum)) {
            throw new Error('Receiver ID가 유효한 숫자가 아닙니다.');
          }
          console.log('Receiver ID:', receiverIdNum);

          const requestBody = { member_ids: [receiverIdNum] };
          console.log('Sending request body:', JSON.stringify(requestBody));

          const createResponse = await fetch(`${process.env.REACT_APP_API_URL}/chats/chat-room`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const createResult = await createResponse.json();
          console.log('Create room response:', JSON.stringify(createResult, null, 2));

          if (!createResponse.ok || !createResult.success_or_fail) {
            throw new Error(createResult.message || `채팅방 개설 실패: ${createResponse.status}`);
          }

          currentRoomId = createResult.data.room_id;
          navigate(`/chat/${currentRoomId}`, { replace: true });
          setRoomId(currentRoomId);
        } else if (!currentRoomId) {
          throw new Error('채팅방 ID 또는 Receiver ID가 필요합니다.');
        } else {
          setRoomId(currentRoomId);
        }

        const messagesResponse = await fetch(`${process.env.REACT_APP_API_URL}/chats/${currentRoomId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!messagesResponse.ok) throw new Error('채팅 메시지 리스트를 가져오지 못했습니다.');
        const messagesResult = await messagesResponse.json();
        console.log('초기 메시지 로드:', JSON.stringify(messagesResult, null, 2));
        if (messagesResult.success_or_fail) {
          setMessages(messagesResult.data
              .filter(msg => !msg.is_deleted && msg.status !== 'DELETED') // 삭제된 메시지 제외
              .map(msg => ({
                id: msg.id || msg._id,
                room_id: msg.chat_room_id,
                sender: msg.sender_id?.toString() === getCurrentUserId() ? '나' : '상대방',
                text: msg.message,
                thumbnailImageUrl: msg.thumbnail_image_url,
                originalImageUrl: msg.original_image_url,
                type: msg.type || (msg.original_image_url ? 'IMAGE' : 'TEXT'),
                time: parseDate(msg.created_at).toLocaleString(),
                unread_count: msg.unread_count || 0,
                status: msg.status,
                is_deleted: msg.is_deleted || false,
              })) || []);
        } else {
          throw new Error(messagesResult.message || '채팅 메시지 로드 실패');
        }

        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          const wsUrl = `${process.env.REACT_APP_WS_URL}/ws/chat/${currentRoomId}?token=${encodeURIComponent(accessToken)}`;
          console.log('WebSocket URL:', wsUrl);
          wsRef.current = new WebSocket(wsUrl);

          wsRef.current.onopen = () => console.log(`WebSocket 연결 성공 - 채팅방 번호: ${currentRoomId}`);
          wsRef.current.onmessage = handleWebSocketMessage;
          wsRef.current.onerror = (error) => {
            console.error('WebSocket 오류:', error);
            setError('WebSocket 연결에 실패했습니다.');
          };
          wsRef.current.onclose = (event) => {
            console.log('WebSocket 연결 종료:', event.code, event.reason);
          };
        }
      } catch (err) {
        setError(err.message);
        console.error('Setup error:', err);
        if (err.message.includes('로그인')) navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    setupChatRoom();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [chatRoomId, receiverId, navigate, handleWebSocketMessage]);

  const handleFileChange = async (event) => {
    const newFiles = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
    if (files.length + newFiles.length > MAX_FILES) {
      setError(`이미지는 최대 ${MAX_FILES}장까지 첨부할 수 있습니다.`);
      return;
    }

    if (!roomId) {
      setError('채팅방이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('로그인 정보가 없습니다.');

      const uploadedFiles = await Promise.all(
          newFiles.map(async (file) => {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/chats/${roomId}/image-upload`,
                null,
                {
                  headers: { 'Authorization': `Bearer ${accessToken}` },
                  params: { folderPath: 'chat', fileName: file.name },
                }
            );

            console.log('Presigned Response:', JSON.stringify(response.data, null, 2));

            if (!response.data.success_or_fail) {
              throw new Error(response.data.message || 'Presigned URL 요청 실패');
            }

            const { uploading_image_url, image_entity_id } = response.data.data || {};
            if (!uploading_image_url) {
              throw new Error('Presigned URL이 누락되었습니다.');
            }

            await axios.put(uploading_image_url, file, {
              headers: { 'Content-Type': file.type },
            });
            console.log('Original S3 Upload Success:', uploading_image_url);

            return { file, originalPresignedUrl: uploading_image_url, imageId: image_entity_id };
          })
      );

      setFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
    } catch (err) {
      setError('이미지 업로드 실패: ' + err.message);
      console.error('Upload Error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileRemove = async (index) => {
    const fileToRemove = files[index];
    if (fileToRemove.imageId) {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) throw new Error('로그인 정보가 없습니다.');

        setUploading(true);
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/chats/${roomId}/image/${fileToRemove.imageId}/cancel`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`이미지 삭제 실패: ${errorText}`);
        }

        const result = await response.json();
        if (!result.success_or_fail) {
          throw new Error(result.message || '이미지 삭제 요청 실패');
        }

        console.log(`Image ${fileToRemove.imageId} canceled and removed from server`);
      } catch (err) {
        setError(`이미지 삭제 실패: ${err.message}`);
        console.error('Image removal error:', err);
      } finally {
        setUploading(false);
      }
    }
    setFiles(files.filter((_, i) => i !== index));
    setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== fileToRemove.imageId)
    );
  };

  const handleSendMessage = async () => {
    if (!roomId) {
      setError('채팅방이 개설되지 않았습니다.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setError('로그인 정보가 없습니다.');
      navigate('/login');
      return;
    }

    try {
      setUploading(true);

      if (files.length > 0) {
        const imageIds = files.map(f => f.imageId).filter(id => id != null);
        if (imageIds.length === 0) {
          throw new Error('유효한 Image ID가 없습니다.');
        }
        console.log('Sending Image IDs:', imageIds);
        const sendResponse = await fetch(`${process.env.REACT_APP_API_URL}/chats/${roomId}/image-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image_ids: imageIds }),
        });
        if (!sendResponse.ok) {
          const errorText = await sendResponse.text();
          console.error('Image message error:', sendResponse.status, errorText);
          throw new Error(`이미지 메시지 전송 실패: ${sendResponse.status} - ${errorText}`);
        }
        const sendResult = await sendResponse.json();
        console.log('Image Send Response:', JSON.stringify(sendResult, null, 2));
        if (!sendResult.success_or_fail) throw new Error(sendResult.message || '이미지 메시지 전송 실패');
        setFiles([]);
      }

      if (message.trim()) {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${roomId}/message`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: message }),
        });
        if (!response.ok) throw new Error('메시지 전송에 실패했습니다.');
        const result = await response.json();
        console.log('Text Send Response:', JSON.stringify(result, null, 2));
        if (!result.success_or_fail) throw new Error(result.message || '메시지 전송 실패');
        setMessage('');
      }
    } catch (err) {
      setError(err.message);
      console.error('Send message error:', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>오류: {error}</div>;
  if (!roomId) return <div style={{ textAlign: 'center', padding: '20px' }}>채팅방을 개설할 수 없습니다.</div>;

  return (
      <ThemeProvider theme={theme}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <Typography variant="h4" gutterBottom>채팅방 (방 번호 #{roomId})</Typography>
          <Box sx={{ height: '400px', bgcolor: '#f5f5f5', borderRadius: 2, p: 2, mb: 2, overflowY: 'auto' }}>
            <List>
              {messages.map((msg) => {
                console.log('Rendering message:', JSON.stringify(msg, null, 2));
                return (
                    <ListItem
                        key={msg.id}
                        sx={{
                          bgcolor: msg.sender === '나' ? '#e3f2fd' : '#fff',
                          borderRadius: 1,
                          mb: 1,
                          alignSelf: msg.sender === '나' ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                        }}
                    >
                      <ListItemText
                          primary={`${msg.sender} (${msg.time})`}
                          secondary={
                            msg.type === 'IMAGE' && msg.originalImageUrl ? (
                                <div>
                                  <img
                                      src={msg.originalImageUrl}
                                      alt="chat image"
                                      style={{ maxWidth: '100px', maxHeight: '100px', cursor: 'pointer' }}
                                      onClick={() => window.open(msg.originalImageUrl, '_blank')}
                                      onError={(e) => {
                                        console.error('Image load error:', msg.originalImageUrl);
                                        e.target.onerror = null; // 무한 루프 방지
                                      }}
                                  />
                                </div>
                            ) : (
                                msg.text
                            )
                          }
                          sx={{
                            color: msg.sender === '나' ? '#1976d2' : '#000',
                            textAlign: msg.sender === '나' ? 'right' : 'left',
                          }}
                      />
                    </ListItem>
                );
              })}
              {files.map(({ file, imageId }, index) => (
                  <ListItem
                      key={imageId || file.name + index}
                      sx={{
                        bgcolor: '#e3f2fd',
                        borderRadius: 1,
                        mb: 1,
                        alignSelf: 'flex-end',
                        maxWidth: '70%',
                      }}
                  >
                    <ListItemText
                        primary="나 (미리보기)"
                        secondary={
                          <div style={{ position: 'relative' }}>
                            <img
                                src={URL.createObjectURL(file)}
                                alt="preview"
                                style={{ maxWidth: '100px', maxHeight: '100px', cursor: 'pointer' }}
                            />
                            <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0, 0, 0, 0.5)' }}>
                              <IconButton
                                  sx={{ color: 'white' }}
                                  onClick={() => handleFileRemove(index)}
                                  disabled={uploading}
                              >
                                <CloseIcon />
                              </IconButton>
                            </div>
                          </div>
                        }
                        sx={{ color: '#1976d2', textAlign: 'right' }}
                    />
                  </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
                fullWidth
                label="메시지 입력"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                variant="outlined"
                sx={{ bgcolor: '#fff' }}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
                variant="contained"
                color="secondary"
                startIcon={<SendIcon />}
                onClick={handleSendMessage}
                disabled={uploading}
                sx={{ bgcolor: '#ff6f61', '&:hover': { bgcolor: '#e65b50' } }}
            >
              보내기
            </Button>
            <Button
                variant="contained"
                color="primary"
                startIcon={<AttachFileIcon />}
                component="label"
                disabled={uploading || files.length >= MAX_FILES || !roomId}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
            >
              이미지
              <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
              />
            </Button>
          </Box>
          {uploading && <CircularProgress />}
        </div>
      </ThemeProvider>
  );
}

export default ChatRoom;