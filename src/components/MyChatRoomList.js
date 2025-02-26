// MyChatRoomList.js
import { useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'; // 이동 아이콘

function MyChatRoomList() {
    const [chatRooms, setChatRooms] = useState([]); // 채팅방 리스트 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [error, setError] = useState(null); // 에러 상태
    const navigate = useNavigate();

    // 컴포넌트 마운트 시 채팅방 리스트 API 호출
    useEffect(() => {
        const fetchChatRooms = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken'); // accessToken 가져오기
                if (!accessToken) {
                    throw new Error('로그인 정보가 없습니다. 로그인 후 이용해주세요.');
                }

                const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/chat-rooms`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`, // accessToken을 Bearer 토큰으로 헤더에 포함
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('채팅방 리스트를 가져오지 못했습니다.');
                }

                const result = await response.json();
                if (result.success_or_fail) { // snake_case로 수정: success_or_fail
                    setChatRooms(result.data || []); // 채팅방 리스트 설정
                } else {
                    throw new Error(result.message || '채팅방 리스트 로드 실패');
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

        fetchChatRooms();
    }, [navigate]); // navigate를 의존성에 추가

    // 채팅방 클릭 시 ChatRoom.js로 이동 (chatRoomId 전달)
    const handleChatRoomClick = (roomId) => {
        navigate(`/chat/${roomId}`); // 채팅방 상세 페이지로 이동 (ChatRoom.js로 라우팅)
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
    if (error) return <div style={{ color: 'red', textAlign: 'center' }}>오류: {error}</div>;
    if (chatRooms.length === 0) return <div style={{ textAlign: 'center', padding: '20px' }}>참여 중인 채팅방이 없습니다.</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom>내 채팅방 리스트</Typography>
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                <List>
                    {chatRooms.map((room) => (
                        <ListItem
                            key={room.room_id}
                            onClick={() => handleChatRoomClick(room.room_id)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: '#f5f5f5',
                                },
                                borderBottom: '1px solid #e0e0e0',
                                padding: '10px',
                            }}
                        >
                            <ListItemText
                                primary={`채팅방 #${room.room_id}`}
                                secondary={
                                    <>
                                        {room.last_message || '메시지가 없습니다.'}
                                        {room.last_message_time && ` - ${new Date(room.last_message_time).toLocaleString()}`}
                                    </>
                                }
                            />
                            <ListItemSecondaryAction>
                                <Badge badgeContent={room.unread_count} color="error">
                                    <IconButton edge="end" aria-label="채팅방 이동">
                                        <ArrowForwardIosIcon />
                                    </IconButton>
                                </Badge>
                                <Typography variant="caption" sx={{ ml: 1 }}>
                                    참여자: {room.member_count}
                                </Typography>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/')}
                        sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': {
                                backgroundColor: '#1565c0',
                            },
                            borderRadius: 2,
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            padding: '10px 20px',
                            fontWeight: 'bold',
                            textTransform: 'none',
                        }}
                    >
                        홈으로 돌아가기
                    </Button>
                </Box>
            </Box>
        </div>
    );
}

export default MyChatRoomList;