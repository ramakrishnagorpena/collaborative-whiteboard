import React, { useState } from 'react';
import styles from '../styles/Whiteboard.module.css';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface JoinRoomProps {
  onJoin: (name: string, roomId: string) => void;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const { theme, toggleTheme } = useTheme();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && roomId.trim()) {
      onJoin(name.trim(), roomId.trim());
    }
  };

  return (
    <div className={`${styles.joinContainer} ${theme === 'dark' ? styles.dark : ''}`}>
      <button
        className={styles.themeSwitcher}
        onClick={toggleTheme}
        aria-label="Toggle theme"
        style={{ position: 'absolute', top: '1rem', right: '1rem' }}
      >
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      
      <form className={`${styles.joinForm} ${theme === 'dark' ? styles.dark : ''}`} onSubmit={handleSubmit}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: theme === 'dark' ? '#f9fafb' : '#1f2937' }}>
          Join Collaborative Whiteboard
        </h1>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="name">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            className={styles.formInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="roomId">
            Room ID
          </label>
          <input
            id="roomId"
            type="text"
            className={styles.formInput}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID or create new"
            required
          />
          <small style={{ 
            fontSize: '0.75rem', 
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            marginTop: '0.5rem',
            display: 'block'
          }}>
            Enter an existing room ID to join or create a new one
          </small>
        </div>
        
        <button
          type="submit"
          className={styles.formButton}
          disabled={!name.trim() || !roomId.trim()}
        >
          Join Room
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;