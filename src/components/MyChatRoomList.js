import { useEffect, useState, useCallback } from 'react'; // useCallback 추가
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
    Tooltip, // 툴팁 추가
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DeleteIcon from '@mui/icons-material/Delete'; // 삭제 아이콘 추가
import { jwtDecode } from 'jwt-decode';

function MyChatRoomList() {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { ws, wsRef, connectWebSocket } = useWebSocket();

    // JWT에서 userId 추출
    const getUserIdFromToken = (token) => {
        try {
            const decoded = jwtDecode(token);
            return decoded.sub || null;
        } catch (err) {
            console.error('JWT 디코딩 실패:', err);
            return null;
        }
    };

    // unread_count 가져오기 헬퍼 함수
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
            return result.data || 0;
        } catch (err) {
            console.error(`unreadCount 조회 실패 (chatRoomId: ${chatRoomId}):`, err);
            return 0;
        }
    };

    // 채팅방 리스트 가져오기
    const fetchChatRooms = async (token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/chat-rooms`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('채팅방 리스트를 가져오지 못했습니다.');
            const result = await response.json();
            if (!result.success_or_fail) throw new Error(result.message || '채팅방 리스트 로드 실패');

            const rooms = result.data || [];
            const updatedRooms = await Promise.all(
                rooms.map(async (room) => ({
                    ...room,
                    unread_count: await fetchUnreadCount(room.room_id, token),
                }))
            );
            setChatRooms(updatedRooms);
        } catch (err) {
            setError(err.message);
            if (err.message.includes('로그인')) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    // 채팅방 삭제 함수 추가
    const handleDeleteChatRoom = async (chatRoomId) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('로그인 정보가 없습니다.');
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/chat-room/${chatRoomId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('채팅방 삭제 실패');
            setChatRooms((prevRooms) => prevRooms.filter((room) => room.room_id !== chatRoomId));
            console.log(`Chat room ${chatRoomId} deleted`);
        } catch (err) {
            setError(`채팅방 삭제 실패: ${err.message}`);
        }
    };

    // WebSocket 메시지 처리 (useCallback으로 최적화)
    const handleWebSocketMessage = useCallback((event) => {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        if (data.type === 'message') {
            setChatRooms((prevRooms) => {
                const updatedRooms = prevRooms.filter((room) => room.room_id !== data.chatRoomId);
                const existingRoom = prevRooms.find((room) => room.room_id === data.chatRoomId) || {};
                const updatedRoom = {
                    room_id: data.chatRoomId,
                    last_message: data.message,
                    last_message_time: new Date(data.timestamp).toISOString(),
                    unread_count: data.unread_count, // 실시간 unread_count 반영
                    member_count: existingRoom.member_count || 0,
                };
                updatedRooms.unshift(updatedRoom); // 최신 메시지 있는 방을 맨 위로
                return [...updatedRooms];
            });
        }
    }, []);

    // 초기 설정 및 WebSocket 연결
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userId = getUserIdFromToken(token);

        if (!token || !userId) {
            setError('로그인 정보가 없습니다. 로그인 후 이용해주세요.');
            setLoading(false);
            navigate('/login');
            return;
        }

        fetchChatRooms(token);

        if (!ws && token && userId) {
            connectWebSocket(userId, token);
        }

        if (wsRef.current) {
            wsRef.current.onmessage = handleWebSocketMessage;
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.onmessage = null;
            }
        };
    }, [navigate, ws, wsRef, connectWebSocket, handleWebSocketMessage]);

    // 채팅방 클릭 핸들러
    const handleChatRoomClick = (roomId) => {
        navigate(`/chat/${roomId}`);
    };

    // 로딩, 에러, 빈 리스트 처리
    if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#1976d2' }}>로딩 중...</div>;
    if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>오류: {error}</div>;
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
                                <Typography variant="caption" sx={{ ml: 1, mr: 2 }}>
                                    참여자: {room.member_count}
                                </Typography>
                                <Tooltip title="채팅방 삭제">
                                    <IconButton
                                        edge="end"
                                        aria-label="채팅방 삭제"
                                        onClick={(e) => {
                                            e.stopPropagation(); // 리스트 클릭 방지
                                            handleDeleteChatRoom(room.room_id);
                                        }}
                                    >
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => fetchChatRooms(localStorage.getItem('accessToken'))}
                        sx={{ padding: '10px 20px', textTransform: 'none' }}
                    >
                        새로고침
                    </Button>
                </Box>
            </Box>
        </div>
    );
}

export default MyChatRoomList;