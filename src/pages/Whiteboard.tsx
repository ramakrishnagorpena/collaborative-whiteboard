import React, { useState, useCallback } from 'react';
import styles from '../styles/Whiteboard.module.css';
import { Tool } from '../types';
import { useWhiteboard } from '../context/WhiteboardContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import WhiteboardCanvas from '../components/WhiteboardCanvas';
import Toolbar from '../components/Toolbar';
import UsersPanel from '../components/UsersPanel';
import CursorOverlay from '../components/CursorOverlay';
import Header from '../components/Header';

const Whiteboard: React.FC = () => {
  const { theme } = useTheme();
  const { state, undo, redo, clearShapes, updateBackground } = useWhiteboard();
  const { currentUser, currentRoom, users, leaveRoom, sendBackgroundUpdate } = useSocket();
  
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fillColor, setFillColor] = useState('transparent');
  const [fontSize, setFontSize] = useState(20);
  
  const handleExport = useCallback(() => {
    const stage = document.querySelector('canvas');
    if (!stage) return;
    
    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    // Set dimensions to match the stage
    tempCanvas.width = stage.width;
    tempCanvas.height = stage.height;
    
    // Fill with white or current background
    if (state.background?.type === 'color') {
      ctx.fillStyle = state.background.value;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // If there's a background image, draw it first
    if (state.background?.type === 'image') {
      const img = new Image();
      img.src = state.background.value;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        // Then draw the stage content
        ctx.drawImage(stage, 0, 0);
        
        // Convert to data URL and download
        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    } else {
      // If no background image, just draw the stage content
      ctx.drawImage(stage, 0, 0);
      
      // Convert to data URL and download
      const dataURL = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [state.background]);

  const handleBackgroundChange = (type: 'color' | 'image', value: string) => {
    const background = { type, value };
    updateBackground(background);
    sendBackgroundUpdate(background);
  };
  
  if (!currentUser || !currentRoom) {
    return null;
  }
  
  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : ''}`}>
      <Header 
        roomName={currentRoom.name} 
        onLeave={leaveRoom} 
      />
      
      <div className={`${styles.whiteboardContainer} ${theme === 'dark' ? styles.dark : ''}`}>
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          fillColor={fillColor}
          setFillColor={setFillColor}
          fontSize={fontSize}
          setFontSize={setFontSize}
          onClear={clearShapes}
          onUndo={undo}
          onRedo={redo}
          onExport={handleExport}
          background={state.background}
          onBackgroundChange={handleBackgroundChange}
        />
        
        <WhiteboardCanvas
          activeTool={activeTool}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          fillColor={fillColor}
          fontSize={fontSize}
        />
        
        <UsersPanel
          users={users}
          currentUserId={currentUser.id}
        />
        
        <CursorOverlay
          users={users}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  );
};

export default Whiteboard;