import React from 'react';
import styles from '../styles/Whiteboard.module.css';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface UsersPanelProps {
  users: User[];
  currentUserId: string | undefined;
}

const UsersPanel: React.FC<UsersPanelProps> = ({ users, currentUserId }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`${styles.usersPanel} ${theme === 'dark' ? styles.dark : ''}`}>
      <h3>Users ({users.length})</h3>
      <ul className={styles.usersList}>
        {users.map((user) => (
          <li key={user.id} className={styles.userItem}>
            <div 
              className={styles.userColor} 
              style={{ backgroundColor: user.color }}
            />
            <span className={styles.userName}>
              {user.name} {user.id === currentUserId ? '(You)' : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersPanel;