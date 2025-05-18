import { useRef, useCallback } from 'react';

interface UseCanvasExportOptions {
  filename?: string;
}

export const useCanvasExport = ({ filename = 'whiteboard' }: UseCanvasExportOptions = {}) => {
  const stageRef = useRef<any>(null);

  const exportToPng = useCallback(() => {
    if (!stageRef.current) return;
    
    const dataURL = stageRef.current.toDataURL({ 
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 2 // For higher resolution
    });
    
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filename]);

  const exportToJson = useCallback((data: any) => {
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filename]);

  return {
    stageRef,
    exportToPng,
    exportToJson
  };
};