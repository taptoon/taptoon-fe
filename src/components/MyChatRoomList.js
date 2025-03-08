import { useEffect, useState } from 'react';
import { useWebSocket } from '../WebSocketContext';
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
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { jwtDecode } from 'jwt-decode';

function MyChatRoomList() {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { ws, wsRef, connectWebSocket } = useWebSocket();

    const getUserIdFromToken = (token) => {
        try {
            const decoded = jwtDecode(token);
            return decoded.sub || null;
        } catch (err) {
            console.error('JWT 디코딩 실패:', err);
            return null;
        }
    };

    const fetchUnreadCount = async (chatRoomId, token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${chatRoomId}/unread`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('unreadCount 가져오기 실패');
            const result = await response.json();
            console.log(`unreadCount for ${chatRoomId}:`, result.data); // 디버깅용
            return result.data || 0;
        } catch (err) {
            console.error('unreadCount 조회 실패:', err);
            return 0;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userId = getUserIdFromToken(token);

        const fetchChatRooms = async () => {
            try {
                if (!token) throw new Error('로그인 정보가 없습니다. 로그인 후 이용해주세요.');

                const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/chat-rooms`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('채팅방 리스트를 가져오지 못했습니다.');

                const result = await response.json();
                if (result.success_or_fail) {
                    const rooms = result.data || [];
                    const updatedRooms = await Promise.all(
                        rooms.map(async (room) => ({
                            ...room,
                            unread_count: await fetchUnreadCount(room.room_id, token),
                        }))
                    );
                    setChatRooms(updatedRooms);
                } else {
                    throw new Error(result.message || '채팅방 리스트 로드 실패');
                }
            } catch (err) {
                setError(err.message);
                if (err.message.includes('로그인')) navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchChatRooms();

        if (!ws && token && userId) connectWebSocket(userId, token);

        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);
            if (data.type === 'message') {
                setChatRooms((prevRooms) => {
                    const updatedRooms = prevRooms.filter((room) => room.room_id !== data.chatRoomId);
                    const existingRoom = prevRooms.find((room) => room.room_id === data.chatRoomId) || {};
                    const updatedRoom = {
                        room_id: data.chatRoomId,
                        last_message: data.message,
                        last_message_time: new Date(data.timestamp).toISOString(),
                        unread_count: data.unread_count, // 서버에서 받은 값 사용
                        member_count: existingRoom.member_count || 0,
                    };
                    updatedRooms.unshift(updatedRoom);
                    console.log('Updated Rooms:', updatedRooms);
                    return [...updatedRooms];
                });
            }
        };

        if (wsRef.current) wsRef.current.onmessage = handleMessage;

        return () => {
            if (wsRef.current) wsRef.current.onmessage = null;
        };
    }, [navigate, ws, wsRef, connectWebSocket]);

    const handleChatRoomClick = (roomId) => {
        navigate(`/chat/${roomId}`);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
    if (error) return <div style={{ color: 'red', textAlign: 'center' }}>오류: {error}</div>;
    if (chatRooms.length === 0) return <div style={{ textAlign: 'center', padding: '20px' }}>참여 중인 채팅방이 없습니다.</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom>내 채팅방 리스트</Typography>
            <Box sx={{ mt: 2, p: '20px', backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                <List>
                    {chatRooms.map((room) => (
                        <ListItem
                            key={room.room_id}
                            onClick={() => handleChatRoomClick(room.room_id)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: '#f5f5f5' },
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
                            '&:hover': { backgroundColor: '#1565c0' },
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