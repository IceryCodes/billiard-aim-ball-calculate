import React, { useMemo } from 'react';

import { getThemedStyles } from '../darkModeConstants';
import { LAYOUT } from '../reactFlowConstants';
import { RoundTitleNodeData } from '../reactFlowTypes';

const OptimizedRoundTitleNode: React.FC<{ data: RoundTitleNodeData }> = React.memo(({ data }) => {
  const { title, roundNumber } = data;
  const themedStyles = useMemo(() => getThemedStyles(), []);

  // 決定是否為冠軍標題
  const isChampionTitle = roundNumber === 0;

  return (
    <div
      className="relative"
      style={{
        width: LAYOUT.titleWidth,
        height: LAYOUT.headerHeight,
      }}
    >
      {/* 輪次標題框 */}
      <div
        className={`${
          isChampionTitle ? themedStyles.championTitleNode : themedStyles.roundTitleNode
        } w-full h-full flex items-center justify-center transition-colors duration-200`}
      >
        <span className={`${isChampionTitle ? themedStyles.championTitleText : themedStyles.roundTitleText} font-bold`}>
          {isChampionTitle && '🏆 '}
          {title}
        </span>
      </div>
    </div>
  );
});

OptimizedRoundTitleNode.displayName = 'OptimizedRoundTitleNode';

export default OptimizedRoundTitleNode;
