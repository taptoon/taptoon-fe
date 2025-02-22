import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { matchingPostId } = useParams();
  const [messages, setMessages] = useState([]); // 더미 메시지
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // 더미 데이터 (실제 백엔드/소켓 연동 필요)
  useEffect(() => {
    setMessages([
      { id: 1, sender: '작성자', text: '안녕하세요, 함께 작업하시겠어요?', time: '2025-02-22 14:00' },
      { id: 2, sender: '나', text: '네, 가능합니다!', time: '2025-02-22 14:05' },
    ]);
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: messages.length + 1, sender: '나', text: message, time: new Date().toLocaleString() }]);
      setMessage('');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>채팅방 (게시글 #{matchingPostId})</Typography>
        <Box sx={{ height: '400px', bgcolor: '#f5f5f5', borderRadius: 2, p: 2, mb: 2, overflowY: 'auto' }}>
          <List>
            {messages.map((msg) => (
              <ListItem key={msg.id} sx={{ bgcolor: msg.sender === '나' ? '#e3f2fd' : '#fff', borderRadius: 1, mb: 1 }}>
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