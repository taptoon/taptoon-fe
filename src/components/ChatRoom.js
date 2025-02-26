import {useEffect, useRef, useState} from 'react'; // useRef 추가로 WebSocket 연결 유지
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {Box, Button, List, ListItem, ListItemText, TextField, Typography} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import './ChatRoom.css';
import {jwtDecode} from 'jwt-decode'; // JWT 디코딩 라이브러리

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#ff6f61',
    },
    green: {
      main: '#4CAF50', // 초록색 (채팅 버튼용)
    },
  },
});

function ChatRoom() {
  const { chatRoomId } = useParams(); // URL 파라미터에서 chatRoomId 가져오기 (채팅 목록에서)
  const [searchParams] = useSearchParams(); // 쿼리 파라미터에서 receiverId 가져오기 (매칭 포스트에서)
  const receiverId = searchParams.get('receiverId'); // 매칭 포스트에서 receiverId 가져오기
  const [messages, setMessages] = useState([]); // 채팅 메시지 상태
  const [message, setMessage] = useState(''); // 입력 메시지 상태
  const [roomId, setRoomId] = useState(null); // 채팅방 ID 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태
  const navigate = useNavigate();
  const wsRef = useRef(null); // WebSocket 연결을 유지하기 위한 ref

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
      setError('JWT 토큰 디코딩 실패. 로그인 상태를 확인하세요.');
      return null;
    }
  };

  // 채팅방 설정 및 WebSocket 연결
  useEffect(() => {
    const setupChatRoom = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('로그인 정보가 없습니다. 로그인 후 이용해주세요.');
        }

        let currentRoomId = chatRoomId ? chatRoomId : null;

        if (!currentRoomId && receiverId) {
          // 매칭 포스트에서 receiverId를 사용해 채팅방 개설
          const createResponse = await fetch(`${process.env.REACT_APP_API_URL}/chats/chat-room`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ memberIds: [receiverId] }), // receiverId를 요청 본문에 포함
          });

          if (!createResponse.ok) {
            throw new Error('채팅방 개설에 실패했습니다.');
          }

          const createResult = await createResponse.json();
          if (createResult.success_or_fail) {
            currentRoomId = createResult.data.room_id;
            setRoomId(currentRoomId); // 채팅방 ID 설정
          } else {
            throw new Error(createResult.message || '채팅방 개설 실패');
          }
        } else if (!currentRoomId) {
          throw new Error('채팅방 ID 또는 Receiver ID가 필요합니다.');
        } else {
          setRoomId(currentRoomId); // 채팅 목록에서 가져온 chatRoomId 사용
        }

        // 채팅방 메시지 리스트 가져오기
        const messagesResponse = await fetch(`${process.env.REACT_APP_API_URL}/chats/${currentRoomId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!messagesResponse.ok) {
          throw new Error('채팅 메시지 리스트를 가져오지 못했습니다.');
        }

        const messagesResult = await messagesResponse.json();
        if (messagesResult.success_or_fail) {
          setMessages(messagesResult.data.map(msg => ({
            id: msg.id,
            room_id: msg.chat_room_id,
            sender: msg.sender_id === getCurrentUserId() ? '나' : '상대방',
            text: msg.message,
            time: new Date(msg.created_at).toLocaleString(), // API에서 제공되는 시간 형식에 따라 조정
            unread_count: msg.unread_count,
          })) || []);
        } else {
          throw new Error(messagesResult.message || '채팅 메시지 로드 실패');
        }

        // WebSocket 연결 설정 (accessToken을 쿼리 파라미터로 포함)
        const wsUrl = `${process.env.REACT_APP_WS_URL}/ws/chat/${currentRoomId}?token=${encodeURIComponent(accessToken)}`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log(`WebSocket 연결 성공 - 채팅방 번호: ${currentRoomId}`);
        };

        wsRef.current.onmessage = (event) => {
          const messageData = JSON.parse(event.data);
          console.log('WebSocket 메시지 수신:', messageData);
          // 메시지 업데이트 (sender_id로 구분)
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: messageData.id,
              room_id: messageData.chat_room_id,
              sender: messageData.sender_id === getCurrentUserId() ? '나' : '상대방',
              text: messageData.message,
              time: new Date().toLocaleString(),
              unread_count: messageData.unread_count,
            },
          ]);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket 오류:', error);
          setError('WebSocket 연결에 실패했습니다. 서버 상태를 확인하세요.');
        };

        wsRef.current.onclose = (event) => {
          console.log('WebSocket 연결 종료 - 코드:', event.code, '이유:', event.reason);
          setError('WebSocket 연결이 종료되었습니다. 다시 시도해주세요.');
        };

      } catch (err) {
        setError(err.message);
        if (err.message.includes('로그인')) {
          navigate('/login'); // accessToken이 없으면 로그인 페이지로 리디렉션
        }
      } finally {
        setLoading(false);
      }
    };

    setupChatRoom();

    // 컴포넌트 언마운트 시 WebSocket 연결 종료
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chatRoomId, receiverId, navigate]); // chatRoomId와 receiverId, navigate를 의존성에 추가

  // 메시지 보내기 (API로 전송, WebSocket으로 실시간 반영)
  const handleSendMessage = async () => {
    if (!roomId) {
      setError('채팅방이 개설되지 않았습니다. 다시 시도해주세요.');
      return;
    }

    if (message.trim()) {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('로그인 정보가 없습니다. 로그인 후 이용해주세요.');
        }

        // API를 통해 메시지 전송
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${roomId}/message`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
          throw new Error('메시지 전송에 실패했습니다.');
        }

        const result = await response.json();
        if (!result.success_or_fail) {
          throw new Error(result.message || '메시지 전송 실패');
        }

        // WebSocket을 통해 실시간 반영은 서버에서 처리하므로, 여기서는 상태를 업데이트하지 않음
        setMessage('');
      } catch (err) {
        setError(err.message);
        if (err.message.includes('로그인')) {
          navigate('/login');
        }
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>오류: {error}</div>;
  if (!roomId) return <div style={{ textAlign: 'center', padding: '20px' }}>채팅방을 개설할 수 없습니다.</div>;

  return (
      <ThemeProvider theme={theme}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <Typography variant="h4" gutterBottom>채팅방 (방 번호 #{roomId})</Typography>
          <Box sx={{ height: '400px', bgcolor: '#f5f5f5', borderRadius: 2, p: 2, mb: 2, overflowY: 'auto' }}>
            <List>
              {messages.map((msg) => (
                  <ListItem
                      key={msg.id}
                      sx={{
                        bgcolor: msg.sender === '나' ? '#e3f2fd' : '#fff',
                        borderRadius: 1,
                        mb: 1,
                        alignSelf: msg.sender === '나' ? 'flex-end' : 'flex-start', // 오른쪽(자신) 또는 왼쪽(상대방) 정렬
                        maxWidth: '70%', // 메시지 폭 제한
                      }}
                  >
                    <ListItemText
                        primary={`${msg.sender} (${msg.time})`}
                        secondary={msg.text}
                        sx={{
                          color: msg.sender === '나' ? '#1976d2' : '#000',
                          textAlign: msg.sender === '나' ? 'right' : 'left', // 텍스트 정렬
                        }}
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
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} // Enter 키로 메시지 전송
            />
            <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSendMessage}
                sx={{ bgcolor: '#ff6f61', '&:hover': { bgcolor: '#e65b50' } }}
            >
              보내기
            </Button>
          </Box>
        </div>
      </ThemeProvider>
  );
}

export default ChatRoom;