import React, { useCallback, useEffect, useRef, useState } from 'react';

interface TooltipProps {
  title: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ title, children, placement = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  // 計算 Tooltip 位置
  const calculatePosition = useCallback(() => {
    if (!tooltipRef.current || !triggerRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = -tooltipRect.height - 10;
        left = (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.height + 10;
        left = (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = (triggerRect.height - tooltipRect.height) / 2;
        left = -tooltipRect.width - 10;
        break;
      case 'right':
        top = (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.width + 10;
        break;
    }

    return { top, left };
  }, [placement]);

  // 當 tooltip 變為可見時，計算位置
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const { top, left } = calculatePosition();
      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  }, [calculatePosition, isVisible]);

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      ref={triggerRef}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-50 px-3 py-2 text-sm text-white bg-black rounded shadow-lg whitespace-nowrap"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {title}
          <div
            className={`absolute w-2 h-2 bg-black transform rotate-45 ${
              placement === 'top'
                ? 'bottom-0 translate-y-1/2'
                : placement === 'bottom'
                  ? 'top-0 -translate-y-1/2'
                  : placement === 'left'
                    ? 'right-0 translate-x-1/2'
                    : 'left-0 -translate-x-1/2'
            }`}
            style={{
              left: placement === 'top' || placement === 'bottom' ? '50%' : placement === 'left' ? '100%' : '0%',
              top: placement === 'left' || placement === 'right' ? '50%' : placement === 'top' ? '100%' : '0%',
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
