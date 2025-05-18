import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { WhiteboardProvider } from './context/WhiteboardContext';
import { SocketProvider } from './context/SocketContext';
import JoinRoom from './components/JoinRoom';
import Whiteboard from './pages/Whiteboard';
import { useSocket } from './context/SocketContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SocketProvider>
        <WhiteboardProvider>
          <WhiteboardApp />
        </WhiteboardProvider>
      </SocketProvider>
    </ThemeProvider>
  );
};

const WhiteboardApp: React.FC = () => {
  const { currentRoom, joinRoom } = useSocket();
  
  return (
    <div>
      {currentRoom ? <Whiteboard /> : <JoinRoom onJoin={joinRoom} />}
    </div>
  );
};

export default App;