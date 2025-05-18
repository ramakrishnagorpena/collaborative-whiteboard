import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { User, Room, ShapeProps } from '../types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  currentUser: User | null;
  currentRoom: Room | null;
  users: User[];
  joinRoom: (name: string, roomId: string) => void;
  leaveRoom: () => void;
  sendCursorPosition: (x: number, y: number) => void;
  sendShape: (shape: ShapeProps) => void;
  updateShape: (id: string, changes: Partial<ShapeProps>) => void;
  deleteShape: (id: string) => void;
  clearShapes: () => void;
  sendBackgroundUpdate: (background: { type: 'color' | 'image'; value: string }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = 'http://localhost:3001';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setConnected(true);
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onRoomJoined = (data: { room: Room; user: User }) => {
      setCurrentRoom(data.room);
      setCurrentUser(data.user);
      setUsers(data.room.users);
    };

    const onUserJoined = (user: User) => {
      setUsers(prev => [...prev, user]);
    };

    const onUserLeft = (userId: string) => {
      setUsers(prev => prev.filter(user => user.id !== userId));
    };

    const onCursorMove = (data: { userId: string; x: number; y: number }) => {
      setUsers(prev =>
        prev.map(user =>
          user.id === data.userId
            ? { ...user, cursor: { x: data.x, y: data.y } }
            : user
        )
      );
    };

    const onShapeAdded = (shape: ShapeProps) => {
      window.dispatchEvent(new CustomEvent('shape:added', { detail: shape }));
    };

    const onShapeUpdated = (data: { shapeId: string; changes: Partial<ShapeProps> }) => {
      window.dispatchEvent(new CustomEvent('shape:updated', { detail: data }));
    };

    const onShapeDeleted = (shapeId: string) => {
      window.dispatchEvent(new CustomEvent('shape:deleted', { detail: shapeId }));
    };

    const onShapesCleared = () => {
      window.dispatchEvent(new CustomEvent('shapes:cleared'));
    };

    const onBackgroundUpdated = (background: { type: 'color' | 'image'; value: string }) => {
      window.dispatchEvent(new CustomEvent('background:updated', { detail: background }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:joined', onRoomJoined);
    socket.on('user:joined', onUserJoined);
    socket.on('user:left', onUserLeft);
    socket.on('cursor:move', onCursorMove);
    socket.on('shape:added', onShapeAdded);
    socket.on('shape:updated', onShapeUpdated);
    socket.on('shape:deleted', onShapeDeleted);
    socket.on('shapes:cleared', onShapesCleared);
    socket.on('background:updated', onBackgroundUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:joined', onRoomJoined);
      socket.off('user:joined', onUserJoined);
      socket.off('user:left', onUserLeft);
      socket.off('cursor:move', onCursorMove);
      socket.off('shape:added', onShapeAdded);
      socket.off('shape:updated', onShapeUpdated);
      socket.off('shape:deleted', onShapeDeleted);
      socket.off('shapes:cleared', onShapesCleared);
      socket.off('background:updated', onBackgroundUpdated);
    };
  }, [socket]);

  const joinRoom = (name: string, roomId: string) => {
    if (!socket) return;
    
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const userId = uuidv4();
    const user: User = {
      id: userId,
      name,
      color: randomColor,
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('room:join', { user, roomId });
  };

  const leaveRoom = () => {
    if (!socket || !currentRoom) return;
    
    socket.emit('room:leave', { roomId: currentRoom.id });
    setCurrentRoom(null);
    setCurrentUser(null);
    setUsers([]);
  };

  const sendCursorPosition = (x: number, y: number) => {
    if (!socket || !currentRoom || !currentUser) return;
    
    socket.emit('cursor:move', {
      roomId: currentRoom.id,
      userId: currentUser.id,
      x,
      y,
    });
  };

  const sendShape = (shape: ShapeProps) => {
    if (!socket || !currentRoom) return;
    
    socket.emit('shape:add', {
      roomId: currentRoom.id,
      shape,
    });
  };

  const updateShape = (id: string, changes: Partial<ShapeProps>) => {
    if (!socket || !currentRoom) return;
    
    socket.emit('shape:update', {
      roomId: currentRoom.id,
      shapeId: id,
      changes,
    });
  };

  const deleteShape = (id: string) => {
    if (!socket || !currentRoom) return;
    
    socket.emit('shape:delete', {
      roomId: currentRoom.id,
      shapeId: id,
    });
  };

  const clearShapes = () => {
    if (!socket || !currentRoom) return;
    
    socket.emit('shapes:clear', {
      roomId: currentRoom.id,
    });
  };

  const sendBackgroundUpdate = (background: { type: 'color' | 'image'; value: string }) => {
    if (!socket || !currentRoom) return;
    
    socket.emit('background:update', {
      roomId: currentRoom.id,
      background,
    });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        currentUser,
        currentRoom,
        users,
        joinRoom,
        leaveRoom,
        sendCursorPosition,
        sendShape,
        updateShape,
        deleteShape,
        clearShapes,
        sendBackgroundUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};