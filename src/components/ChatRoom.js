import { useState, useEffect } from 'react'; // useEffect 추가로 API 호출
import {useParams, useNavigate, useSearchParams} from 'react-router-dom';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './ChatRoom.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#ff6f61',
    },
  },
});

function ChatRoom() {
  const { matchingPostId } = useParams(); // URL 파라미터에서 matchingPostId 가져오기
  const [searchParams] = useSearchParams(); // 쿼리 파라미터에서 author_id 가져오기
  const [messages, setMessages] = useState([]); // 채팅 메시지 상태
  const [message, setMessage] = useState(''); // 입력 메시지 상태
  const [roomId, setRoomId] = useState(null); // 채팅방 ID 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태
  const navigate = useNavigate();

  // 채팅방 개설 및 메시지 로드
  useEffect(() => {
    const createChatRoom = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken'); // accessToken 가져오기
        if (!accessToken) {
          throw new Error('로그인 정보가 없습니다. 로그인 후 이용해주세요.');
        }

        const receiverId = searchParams.get('receiverId');
        if (!receiverId) {
          throw new Error('Receiver ID가 필요합니다.')
        }

        // 채팅방 개설 API 호출
        const createResponse = await fetch('http://localhost:8080/chats/chat-room', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`, // accessToken을 Bearer 토큰으로 헤더에 포함
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ memberIds: [receiverId] }), // receiverId를 요청 본문에 포함
        });

        if (!createResponse.ok) {
          throw new Error('채팅방 개설에 실패했습니다.');
        }

        // 채팅방 개설. 여기까지는 잘 됨.

        const createResult = await createResponse.json();
        if (createResult.success_or_fail) { // snake_case로 수정: success_or_fail
          setRoomId(createResult.data.room_id); // 채팅방 ID 설정

          // 채팅방 개설 후 메시지 리스트 가져오기 (필요 시 별도 API 호출)
          const messagesResponse = await fetch(`http://localhost:8080/chats/${createResult.data.room_id}/messages`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!messagesResponse.ok) {
            throw new Error('메시지 리스트를 가져오지 못했습니다.');
          }

          const messagesResult = await messagesResponse.json();
          if (messagesResult.success_or_fail) {
            setMessages(messagesResult.data || []); // 메시지 리스트 설정 (API 응답 형식에 따라 조정)
          } else {
            throw new Error(messagesResult.message || '메시지 로드 실패');
          }
        } else {
          throw new Error(createResult.message || '채팅방 개설 실패');
        }
      } catch (err) {
        setError(err.message);
        if (err.message.includes('로그인')) {
          navigate('/login'); // accessToken이 없으면 로그인 페이지로 리디렉션
        }
      } finally {
        setLoading(false);
      }
    };

    createChatRoom();
  }, [matchingPostId, navigate]); // matchingPostId와 navigate를 의존성에 추가

  // 메시지 보내기
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

        const response = await fetch(`http://localhost:8080/chats/${roomId}/message`, {
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
        if (result.success_or_fail) {
          setMessages([...messages, { room_id: roomId, sender: '나', text: message, time: new Date().toLocaleString() }]);
          setMessage('');
        } else {
          throw new Error(result.message || '메시지 전송 실패');
        }
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
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <Typography variant="h4" gutterBottom>채팅방 (게시글 #{matchingPostId}, 방 번호 #{roomId})</Typography>
          <Box sx={{ height: '400px', bgcolor: '#f5f5f5', borderRadius: 2, p: 2, mb: 2, overflowY: 'auto' }}>
            <List>
              {messages.map((msg) => (
                  <ListItem key={msg.id || msg.room_id} sx={{ bgcolor: msg.sender === '나' ? '#e3f2fd' : '#fff', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                        primary={`${msg.sender} (${msg.time})`}
                        secondary={msg.text}
                        sx={{ color: msg.sender === '나' ? '#1976d2' : '#000' }}
                    />
                  </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
          <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate(-1)}
              sx={{ mt: 2, bgcolor: '#f50057', '&:hover': { bgcolor: '#c51162' } }}
          >
            뒤로가기
          </Button>
        </div>
      </ThemeProvider>
  );
}

export default ChatRoom;