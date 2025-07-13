import React, { useMemo } from 'react';

import { Handle, Position } from '@xyflow/react';

import { DOT_STYLE, getThemedStyles } from '../darkModeConstants';
import { LAYOUT } from '../reactFlowConstants';
import { ChampionNodeData } from '../reactFlowTypes';

const OptimizedChampionNode: React.FC<{ data: ChampionNodeData; id: string }> = React.memo(({ data, id }) => {
  const themedStyles = useMemo(() => getThemedStyles(), []);

  if (!data || !data.champion) {
    return null;
  }

  const champion = data.champion;

  return (
    <div
      className="relative"
      style={{
        width: LAYOUT.championBoxWidth,
        height: LAYOUT.championBoxHeight,
      }}
    >
      <Handle type="target" position={Position.Bottom} id={`${id}-target`} style={DOT_STYLE} />

      <div
        className={`${themedStyles.championNode} w-full h-full flex items-center justify-center relative px-2 transition-colors duration-200`}
      >
        <div className="absolute inset-0 bg-yellow-200 dark:bg-yellow-700 rounded animate-pulse opacity-30"></div>
        <span className={`${themedStyles.championText} flex-1 relative`}>{champion.name}</span>
        <span className="text-base ml-1 relative animate-bounce">👑</span>
      </div>
    </div>
  );
});

OptimizedChampionNode.displayName = 'OptimizedChampionNode';
export default OptimizedChampionNode;
