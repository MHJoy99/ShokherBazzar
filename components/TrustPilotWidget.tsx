
import React, { useEffect, useRef } from 'react';

export const TrustPilotWidget: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'dark' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If window.Trustpilot is available, reload the widget to ensure it renders in React
    if (typeof window !== 'undefined' && (window as any).Trustpilot && ref.current) {
      (window as any).Trustpilot.loadFromElement(ref.current);
    }
  }, []);

  return (
    <div 
      ref={ref}
      className="trustpilot-widget" 
      data-locale="en-US" 
      data-template-id="56278e9abfbbba0bdcd568bc" 
      data-businessunit-id="693a6dde78627dbb1563d443" 
      data-style-height="52px" 
      data-style-width="100%" 
      data-theme={theme} // Enforces Dark Mode style from Trustpilot
      data-token="47378a5b-020f-4dce-a7a9-e754db432839"
    >
      <a href="https://www.trustpilot.com/review/mhjoygamershub.com" target="_blank" rel="noopener noreferrer">Trustpilot</a>
    </div>
  );
};
