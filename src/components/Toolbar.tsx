import React, { useState } from 'react';
import styles from '../styles/Whiteboard.module.css';
import { Tool } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  MousePointer,
  Pencil,
  Square,
  Circle as CircleIcon,
  Type,
  Eraser,
  Minus,
  Download,
  Trash2,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Image,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  background?: { type: 'color' | 'image'; value: string };
  onBackgroundChange: (type: 'color' | 'image', value: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  fillColor,
  setFillColor,
  fontSize,
  setFontSize,
  onClear,
  onUndo,
  onRedo,
  onExport,
  background,
  onBackgroundChange,
}) => {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  const colors = [
    '#000000', // Black
    '#ffffff', // White
    '#e53e3e', // Red
    '#dd6b20', // Orange
    '#d69e2e', // Yellow
    '#38a169', // Green
    '#3182ce', // Blue
    '#805ad5', // Purple
    '#d53f8c', // Pink
  ];

  const tools = [
    { id: 'select' as Tool, icon: <MousePointer size={20} />, label: 'Select' },
    { id: 'pencil' as Tool, icon: <Pencil size={20} />, label: 'Pencil' },
    { id: 'line' as Tool, icon: <Minus size={20} />, label: 'Line' },
    { id: 'rectangle' as Tool, icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle' as Tool, icon: <CircleIcon size={20} />, label: 'Circle' },
    { id: 'text' as Tool, icon: <Type size={20} />, label: 'Text' },
    { id: 'eraser' as Tool, icon: <Eraser size={20} />, label: 'Eraser' },
    { id: 'background' as Tool, icon: <Image size={20} />, label: 'Background' },
  ];

  const actions = [
    { id: 'undo', icon: <UndoIcon size={20} />, label: 'Undo', onClick: onUndo },
    { id: 'redo', icon: <RedoIcon size={20} />, label: 'Redo', onClick: onRedo },
    { id: 'clear', icon: <Trash2 size={20} />, label: 'Clear', onClick: onClear },
    { id: 'export', icon: <Download size={20} />, label: 'Export', onClick: onExport },
  ];

  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onBackgroundChange('image', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileToolbar = () => {
    setShowMobileToolbar(!showMobileToolbar);
  };

  return (
    <>
      {/* Mobile Toolbar Toggle Button */}
      <div className={styles.mobileToggleButton} onClick={toggleMobileToolbar}>
        <Menu size={24} />
      </div>

      {/* Desktop Toolbar */}
      <div
        className={`${styles.toolbar} ${theme === "dark" ? styles.dark : ""} ${
          isCollapsed ? styles.collapsed : ""
        } ${showMobileToolbar ? styles.showMobile : ""}`}
      >
        <div className={styles.toolbarCollapseButton} onClick={toggleCollapse}>
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </div>

        <div
          className={`${styles.toolbarContent} ${
            isCollapsed ? styles.hidden : ""
          }`}
        >
          <div className={styles.toolbarSection}>
            {tools.map((tool) => (
              <div
                key={tool.id}
                className={`${styles.toolButton} ${
              activeTool === tool.id ? styles.activeToolButton : ''
                }`}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
              >
                {tool.icon}
                {!isCollapsed && (
                  <span className={styles.toolLabel}>{tool.label}</span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.toolbarSection}>
            {actions.map((action) => (
              <div
                key={action.id}
                className={styles.toolButton}
                onClick={action.onClick}
                title={action.label}
              >
                {action.icon}
                {!isCollapsed && (
                  <span className={styles.toolLabel}>{action.label}</span>
                )}
              </div>
            ))}
          </div>

          {!isCollapsed && (
            <>
              <div className={styles.toolbarSection}>
                <div className={styles.propertyGroup}>
                  <span className={styles.propertyLabel}>Stroke</span>
                  <div className={styles.colorPicker}>
                    {colors.map((color) => (
                      <div
                        key={`stroke-${color}`}
                        className={`${styles.colorOption} ${
                  strokeColor === color ? styles.activeColorOption : ''
                        }`}
                style={{ backgroundColor: color, borderColor: color === '#ffffff' ? '#d1d5db' : 'transparent' }}
                        onClick={() => setStrokeColor(color)}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className={styles.rangeInput}
                  />
                </div>
              </div>

              <div className={styles.toolbarSection}>
                <div className={styles.propertyGroup}>
                  <span className={styles.propertyLabel}>Fill</span>
                  <div className={styles.colorPicker}>
                    <div
              className={`${styles.colorOption} ${styles.noFillOption} ${
                fillColor === 'transparent' ? styles.activeColorOption : ''
                      }`}
              onClick={() => setFillColor('transparent')}
                      title="No Fill"
                    >
                      <XCircle size={16} />
                    </div>
                    {colors.map((color) => (
                      <div
                        key={`fill-${color}`}
                        className={`${styles.colorOption} ${
                  fillColor === color ? styles.activeColorOption : ''
                        }`}
                style={{ backgroundColor: color, borderColor: color === '#ffffff' ? '#d1d5db' : 'transparent' }}
                        onClick={() => setFillColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

      {activeTool === 'text' && (
                <div className={styles.toolbarSection}>
                  <div className={styles.propertyGroup}>
                    <span className={styles.propertyLabel}>Font Size</span>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className={styles.rangeInput}
                    />
                    <span>{fontSize}px</span>
                  </div>
                </div>
              )}

      {activeTool === 'background' && (
                <div className={styles.toolbarSection}>
                  <div className={styles.propertyGroup}>
                    <span className={styles.propertyLabel}>Background</span>
                    <div className={styles.colorPicker}>
                      {colors.map((color) => (
                        <div
                          key={`bg-${color}`}
                          className={`${styles.colorOption} ${
                    background?.type === 'color' && background.value === color ? styles.activeColorOption : ''
                          }`}
                  style={{ backgroundColor: color, borderColor: color === '#ffffff' ? '#d1d5db' : 'transparent' }}
                  onClick={() => onBackgroundChange('color', color)}
                        />
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundImageChange}
                      className={styles.fileInput}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Toolbar;