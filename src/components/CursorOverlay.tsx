import React from 'react';
import styles from '../styles/Whiteboard.module.css';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CursorOverlayProps {
  users: User[];
  currentUserId: string | undefined;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({ users, currentUserId }) => {
  const { theme } = useTheme();
  
  return (
    <>
      {users.filter(user => 
        user.id !== currentUserId && user.cursor
      ).map(user => (
        <div
          key={user.id}
          className={styles.cursorContainer}
          style={{
            left: user.cursor?.x,
            top: user.cursor?.y,
          }}
        >
          <div 
            className={styles.cursor} 
            style={{ borderBottomColor: user.color }} 
          />
          <div className={`${styles.cursorName} ${theme === 'dark' ? styles.dark : ''}`}>
            {user.name}
          </div>
        </div>
      ))}
    </>
  );
};

export default CursorOverlay;