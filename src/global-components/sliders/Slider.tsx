import React, { useCallback, useEffect, useRef, useState } from 'react';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
}

const Slider: React.FC<SliderProps> = ({ min, max, step = 0.01, value, defaultValue = 0.5, onChange, style }) => {
  const [currentValue, setCurrentValue] = useState<number>(value !== undefined ? value : defaultValue);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Handle value change
  const handleValueChange = useCallback(
    (newValue: number) => {
      // Constrain to min/max
      newValue = Math.max(min, Math.min(max, newValue));

      // Apply step if specified
      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }

      // Update state
      setCurrentValue(newValue);

      // Call onChange if provided
      if (onChange) {
        onChange(newValue);
      }
    },
    [max, min, onChange, step]
  );

  // Calculate value from mouse/touch position
  const updateValueFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent) => {
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      let clientX: number;

      // Handle both mouse and touch events
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const offsetX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
      const newValue = min + percentage * (max - min);

      handleValueChange(newValue);
    },
    [handleValueChange, max, min]
  );

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      updateValueFromEvent(e);
      e.preventDefault();
    },
    [updateValueFromEvent]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        updateValueFromEvent(e);
      }
    },
    [isDragging, updateValueFromEvent]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      updateValueFromEvent(e);
      e.preventDefault();
    },
    [updateValueFromEvent]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging) {
        updateValueFromEvent(e);
        // Prevent scrolling while dragging
        e.preventDefault();
      }
    },
    [isDragging, updateValueFromEvent]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Register global mouse/touch events
  useEffect(() => {
    if (isDragging) {
      // Mouse events
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      // Touch events
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, isDragging]);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
    }
  }, [value]);

  // Calculate percentage for slider position
  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div
      ref={sliderRef}
      className="relative w-full h-6 flex items-center cursor-pointer"
      style={style}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Track background */}
      <div className="absolute w-full h-2 bg-gray-200 rounded-full"></div>

      {/* Filled track */}
      <div className="absolute h-2 bg-blue-500 rounded-full" style={{ width: `${percentage}%` }}></div>

      {/* Thumb */}
      <div
        className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md transform -translate-x-1/2"
        style={{ left: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default Slider;
