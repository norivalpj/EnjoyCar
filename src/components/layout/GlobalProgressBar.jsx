import React, { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export default function GlobalProgressBar() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isLoading = isFetching > 0 || isMutating > 0;
    
    let timer;
    if (isLoading) {
      setVisible(true);
      setProgress(30);
      
      // Simulate progress
      timer = setInterval(() => {
        setProgress(old => {
          if (old > 85) return old;
          const diff = Math.random() * 10;
          return Math.min(old + diff, 90);
        });
      }, 500);
      
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400); // Wait for transition before hiding
    }
    
    return () => {
      clearInterval(timer);
      clearTimeout(timer);
    };
  }, [isFetching, isMutating]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999] pointer-events-none">
      <div 
        className="h-full bg-purple-600 transition-all duration-300 ease-out shadow-[0_0_10px_theme('colors.purple.500')]"
        style={{ 
          width: `${progress}%`,
          opacity: visible ? 1 : 0
        }}
      />
    </div>
  );
}
