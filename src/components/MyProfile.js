import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function MyProfile() {
  const navigate = useNavigate();
  const user = {
    name: '사용자 이름',
    email: 'user@example.com',
    role: 'WRITER',
    joined: '2025-02-22',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>내 프로필</Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">이름: {user.name}</Typography>
        <Typography>이메일: {user.email}</Typography>
        <Typography>역할: {user.role}</Typography>
        <Typography>가입일: {user.joined}</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          홈으로 돌아가기
        </Button>
      </Box>
    </div>
  );
}

export default MyProfile;