import React from 'react';

import { Handle, Position } from '@xyflow/react';

import { Gamer } from '@/domains/tournament';

import { DOT_STYLE } from '../darkModeConstants';
import { LAYOUT, STYLES } from '../reactFlowConstants';
import { MatchNodeData } from '../reactFlowTypes';
import { canMatchProceed, isGamerEmpty } from '../reactFlowUtils';

const ViewOnlyMatchNode: React.FC<{ data: MatchNodeData; id: string }> = ({ data, id }) => {
  const { match } = data;
  const matchCanProceed = canMatchProceed(match);
  const isGamer1Empty = isGamerEmpty(match.gamer1);
  const isGamer2Empty = isGamerEmpty(match.gamer2);

  const getGamerText = (gamer: Gamer | null, isEmpty: boolean): string => {
    if (isEmpty) return '空籤';
    return gamer?.name || '待定';
  };

  const getGamerClasses = (isWinner: boolean, isEmpty: boolean, isLeft: boolean): string => {
    const baseClasses = ['h-full', 'flex', 'items-center', 'justify-center', 'text-sm', 'font-medium', 'px-1'];
    if (isLeft) baseClasses.push('border-r', 'border-gray-300');

    if (isEmpty) {
      baseClasses.push('text-gray-400', 'bg-gray-50');
    } else if (isWinner) {
      baseClasses.push('bg-yellow-100', 'text-orange-800', 'font-bold');
    } else {
      baseClasses.push('bg-white');
    }

    return baseClasses.join(' ');
  };

  const gamer1Classes = getGamerClasses(
    !!(match.winner && match.gamer1 && match.winner.id === match.gamer1.id),
    isGamer1Empty,
    true
  );
  const gamer2Classes = getGamerClasses(
    !!(match.winner && match.gamer2 && match.winner.id === match.gamer2.id),
    isGamer2Empty,
    false
  );

  return (
    <div
      className="relative"
      style={{
        width: LAYOUT.boxWidth,
        height: LAYOUT.boxHeight + (match.round === 1 ? 35 : 0),
      }}
    >
      {/* 極小的連接點 */}
      {match.round > 1 && <Handle type="target" position={Position.Bottom} id={`${id}-target`} style={DOT_STYLE} />}

      <Handle type="source" position={Position.Top} id={`${id}-source`} style={DOT_STYLE} />

      <div className={`${STYLES.matchNode} w-full flex relative`} style={{ height: LAYOUT.boxHeight }}>
        <div className={`${gamer1Classes} w-1/2`}>
          <span className={STYLES.gamerText} style={{ writingMode: 'vertical-rl' }}>
            {getGamerText(match.gamer1, isGamer1Empty)}
          </span>
        </div>

        <div className={`${gamer2Classes} w-1/2`}>
          <span className={STYLES.gamerText} style={{ writingMode: 'vertical-rl' }}>
            {getGamerText(match.gamer2, isGamer2Empty)}
          </span>
        </div>

        {!matchCanProceed && match.round > 1 && <div className={STYLES.lockIcon}>🔒</div>}

        {match.winner && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-orange-500">
            <span className="text-xs">🏆</span>
          </div>
        )}
      </div>

      {match.round === 1 && (
        <div className="absolute top-full mt-1 w-full flex justify-between px-6">
          <div className={`${STYLES.gamesBox} cursor-default`}>
            <span>{match.gamer1?.games || 7}</span>
          </div>

          <div className={`${STYLES.gamesBox} cursor-default`}>
            <span>{match.gamer2?.games || 7}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOnlyMatchNode;
