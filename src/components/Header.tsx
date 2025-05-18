import React from "react";
import styles from "../styles/Header.module.css";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LogOut } from "lucide-react";

interface HeaderProps {
  roomName: string;
  onLeave: () => void;
}

const Header: React.FC<HeaderProps> = ({ roomName, onLeave }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={`${styles.header} ${theme === "dark" ? styles.dark : ""}`}>
      <div className={styles.headerContent}>
        <h1 className={styles.mainHeader}>
          Collaborative Whiteboard
        </h1>
        <h2 className={styles.roomName}>
          Whiteboard: {roomName}
        </h2>
      </div>
      
      <div className={styles.headerControls}>
        <button 
          className={styles.themeSwitcher} 
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button 
          className={styles.actionButton} 
          onClick={onLeave}
          aria-label="Leave room"
        >
          <LogOut size={20} />
          <span className={styles.buttonText}>Leave</span>
        </button>
      </div>
    </div>
  );
};

export default Header;