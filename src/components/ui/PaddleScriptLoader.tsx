'use client';

import { useEffect } from 'react';

interface PaddleScriptLoaderProps {
  clientToken: string;
}

declare global {
  interface Window {
    Paddle: any;
  }
}

export function PaddleScriptLoader({ clientToken }: PaddleScriptLoaderProps) {
  useEffect(() => {
    // Load Paddle.js script
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      // Initialize Paddle
      if (window.Paddle) {
        window.Paddle.Initialize({
          token: clientToken,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [clientToken]);

  return null;
}
