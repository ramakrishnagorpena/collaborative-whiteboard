import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ShapeProps, WhiteboardState } from '../types';

type WhiteboardAction =
  | { type: 'ADD_SHAPE'; payload: ShapeProps }
  | { type: 'UPDATE_SHAPE'; payload: { id: string; changes: Partial<ShapeProps> } }
  | { type: 'DELETE_SHAPE'; payload: string }
  | { type: 'CLEAR_SHAPES' }
  | { type: 'SET_SHAPES'; payload: ShapeProps[] }
  | { type: 'UPDATE_BACKGROUND'; payload: { type: 'color' | 'image'; value: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' };

interface WhiteboardContextType {
  state: WhiteboardState;
  addShape: (shape: ShapeProps) => void;
  updateShape: (id: string, changes: Partial<ShapeProps>) => void;
  deleteShape: (id: string) => void;
  clearShapes: () => void;
  setShapes: (shapes: ShapeProps[]) => void;
  updateBackground: (background: { type: 'color' | 'image'; value: string }) => void;
  undo: () => void;
  redo: () => void;
}

const initialState: WhiteboardState = {
  shapes: [],
  history: [[]],
  
  historyIndex: 0,
  background: {
    type: 'color',
    value: '#ffffff',
  },
};

const whiteboardReducer = (state: WhiteboardState, action: WhiteboardAction): WhiteboardState => {
  switch (action.type) {
    case 'ADD_SHAPE': {
      const newShapes = [...state.shapes, action.payload];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newShapes);
      
      return {
        ...state,
        shapes: newShapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    
    case 'UPDATE_SHAPE': {
      const { id, changes } = action.payload;
      const newShapes = state.shapes.map(shape =>
        shape.id === id ? { ...shape, ...changes } : shape
      );
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newShapes);
      
      return {
        ...state,
        shapes: newShapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    
    case 'DELETE_SHAPE': {
      const newShapes = state.shapes.filter(shape => shape.id !== action.payload);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newShapes);
      
      return {
        ...state,
        shapes: newShapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    
    case 'CLEAR_SHAPES': {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([]);
      
      return {
        ...state,
        shapes: [],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    
    case 'SET_SHAPES': {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(action.payload);
      
      return {
        ...state,
        shapes: action.payload,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'UPDATE_BACKGROUND': {
      return {
        ...state,
        background: action.payload,
      };
    }
    
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        shapes: state.history[newIndex],
        historyIndex: newIndex,
      };
    }
    
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        shapes: state.history[newIndex],
        historyIndex: newIndex,
      };
    }
    
    default:
      return state;
  }
};

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined);

export const WhiteboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(whiteboardReducer, initialState);

  useEffect(() => {
    const handleShapeAdded = (event: CustomEvent<ShapeProps>) => {
      dispatch({ type: 'ADD_SHAPE', payload: event.detail });
    };

    const handleShapeUpdated = (event: CustomEvent<{ shapeId: string; changes: Partial<ShapeProps> }>) => {
      dispatch({ type: 'UPDATE_SHAPE', payload: { id: event.detail.shapeId, changes: event.detail.changes } });
    };

    const handleShapeDeleted = (event: CustomEvent<string>) => {
      dispatch({ type: 'DELETE_SHAPE', payload: event.detail });
    };

    const handleShapesCleared = () => {
      dispatch({ type: 'CLEAR_SHAPES' });
    };

    const handleBackgroundUpdated = (event: CustomEvent<{ type: 'color' | 'image'; value: string }>) => {
      dispatch({ type: 'UPDATE_BACKGROUND', payload: event.detail });
    };

    window.addEventListener('shape:added', handleShapeAdded as EventListener);
    window.addEventListener('shape:updated', handleShapeUpdated as EventListener);
    window.addEventListener('shape:deleted', handleShapeDeleted as EventListener);
    window.addEventListener('shapes:cleared', handleShapesCleared);
    window.addEventListener('background:updated', handleBackgroundUpdated as EventListener);

    return () => {
      window.removeEventListener('shape:added', handleShapeAdded as EventListener);
      window.removeEventListener('shape:updated', handleShapeUpdated as EventListener);
      window.removeEventListener('shape:deleted', handleShapeDeleted as EventListener);
      window.removeEventListener('shapes:cleared', handleShapesCleared);
      window.removeEventListener('background:updated', handleBackgroundUpdated as EventListener);
    };
  }, []);

  const addShape = (shape: ShapeProps) => {
    dispatch({ type: 'ADD_SHAPE', payload: shape });
  };

  const updateShape = (id: string, changes: Partial<ShapeProps>) => {
    dispatch({ type: 'UPDATE_SHAPE', payload: { id, changes } });
  };

  const deleteShape = (id: string) => {
    dispatch({ type: 'DELETE_SHAPE', payload: id });
  };

  const clearShapes = () => {
    dispatch({ type: 'CLEAR_SHAPES' });
  };

  const setShapes = (shapes: ShapeProps[]) => {
    dispatch({ type: 'SET_SHAPES', payload: shapes });
  };

  const updateBackground = (background: { type: 'color' | 'image'; value: string }) => {
    dispatch({ type: 'UPDATE_BACKGROUND', payload: background });
  };

  const undo = () => {
    dispatch({ type: 'UNDO' });
  };

  const redo = () => {
    dispatch({ type: 'REDO' });
  };

  return (
    <WhiteboardContext.Provider
      value={{
        state,
        addShape,
        updateShape,
        deleteShape,
        clearShapes,
        setShapes,
        updateBackground,
        undo,
        redo,
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  );
};

export const useWhiteboard = (): WhiteboardContextType => {
  const context = useContext(WhiteboardContext);
  if (context === undefined) {
    throw new Error('useWhiteboard must be used within a WhiteboardProvider');
  }
  return context;
};