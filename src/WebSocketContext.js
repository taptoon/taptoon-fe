import { createContext, useContext, useState, useRef } from 'react';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
    const [ws, setWs] = useState(null);
    const wsRef = useRef(null); // WebSocket 참조 유지

    const connectWebSocket = (userId, token) => {
        const notificationWs = new WebSocket(`ws://localhost:8080/notifications/${userId}?token=${token}`);
        wsRef.current = notificationWs;
        setWs(notificationWs);

        notificationWs.onopen = () => console.log('WebSocket 연결 성공');
        notificationWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // 알림 처리 로직 (상위 컴포넌트에서 처리 가능)
        };
        notificationWs.onclose = () => {
            setWs(null);
            wsRef.current = null;
        };
    };

    const disconnectWebSocket = () => {
        if (wsRef.current) wsRef.current.close();
    };

    return (
        <WebSocketContext.Provider value={{ ws, wsRef, connectWebSocket, disconnectWebSocket }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export const useWebSocket = () => useContext(WebSocketContext);