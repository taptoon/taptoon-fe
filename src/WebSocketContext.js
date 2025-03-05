import { createContext, useContext, useState } from 'react';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
    const [ws, setWs] = useState(null);

    const connectWebSocket = (userId, token) => {
        const notificationWs = new WebSocket(`ws://localhost:8080/notifications/${userId}?token=${token}`);
        setWs(notificationWs);

        notificationWs.onopen = () => console.log('WebSocket 연결 성공');
        notificationWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // 알림 처리 로직
        };
        notificationWs.onclose = () => setWs(null);

        // 채팅방 연결은 ChatRoom 컴포넌트에서 동적으로 처리
    };

    const disconnectWebSocket = () => {
        if (ws) ws.close();
    };

    return (
        <WebSocketContext.Provider value={{ ws, connectWebSocket, disconnectWebSocket }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export const useWebSocket = () => useContext(WebSocketContext);