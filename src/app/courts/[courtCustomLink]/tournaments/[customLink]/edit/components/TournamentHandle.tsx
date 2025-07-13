import React from 'react';

import { Handle, Position } from '@xyflow/react';

interface TournamentHandleProps {
  type: 'source' | 'target';
  id: string;
  position: Position;
  size?: 'normal' | 'large';
  isVisible?: boolean;
}

const TournamentHandle: React.FC<TournamentHandleProps> = ({ type, id, position, size = 'normal', isVisible = true }) => {
  const handleSize = size === 'large' ? 14 : 12;

  const getPositionStyle = () => {
    const baseStyle = {
      background: '#f97316',
      border: '2px solid #ffffff',
      width: `${handleSize}px`,
      height: `${handleSize}px`,
      borderRadius: '50%',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.2s ease-in-out',
    };

    switch (position) {
      case Position.Top:
        return {
          ...baseStyle,
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case Position.Bottom:
        return {
          ...baseStyle,
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case Position.Left:
        return {
          ...baseStyle,
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case Position.Right:
        return {
          ...baseStyle,
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      default:
        return baseStyle;
    }
  };

  return <Handle type={type} position={position} id={id} style={getPositionStyle()} />;
};

export default TournamentHandle;
