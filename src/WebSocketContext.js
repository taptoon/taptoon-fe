import { createContext, useContext, useState, useRef, useCallback } from 'react';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
    const [ws, setWs] = useState(null);
    const wsRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const userIdRef = useRef(null);
    const tokenRef = useRef(null);

    const connectWebSocket = useCallback((userId, token) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

        const notificationWs = new WebSocket(`${process.env.REACT_APP_WS_URL}/notifications/${userId}?token=${token}`);
        wsRef.current = notificationWs;
        setWs(notificationWs);
        userIdRef.current = userId;
        tokenRef.current = token;

        notificationWs.onopen = () => {
            console.log('WebSocket 연결 성공');
            reconnectAttempts.current = 0;
        };

        notificationWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);
            // MyChatRoomList에서 처리하므로 여기서는 로깅만
        };

        notificationWs.onclose = (event) => {
            console.log('WebSocket 연결 종료:', event.code, event.reason);
            setWs(null);
            wsRef.current = null;

            if (reconnectAttempts.current < maxReconnectAttempts) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
                console.log(`재연결 시도 ${reconnectAttempts.current + 1}/${maxReconnectAttempts} in ${delay}ms`);
                setTimeout(() => {
                    reconnectAttempts.current += 1;
                    connectWebSocket(userIdRef.current, tokenRef.current);
                }, delay);
            } else {
                console.error('최대 재연결 시도 횟수 초과');
            }
        };

        notificationWs.onerror = (error) => {
            console.error('WebSocket 오류:', error);
        };
    }, []);

    const disconnectWebSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            reconnectAttempts.current = maxReconnectAttempts;
        }
    }, []);

    return (
        <WebSocketContext.Provider value={{ ws, wsRef, connectWebSocket, disconnectWebSocket }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export const useWebSocket = () => useContext(WebSocketContext);