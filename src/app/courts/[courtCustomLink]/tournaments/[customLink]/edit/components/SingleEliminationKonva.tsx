'use client';

import { forwardRef, JSX, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { FiberProvider } from 'its-fine';
import Konva from 'konva';
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';

import { Gamer, Match } from '@/domains/tournament';

import { QRCodeCanvas } from '../../components/shared/TournamentShared';

import {
  boxHeight,
  boxWidth,
  canvasBackgroundColor,
  canvasBottomPadding,
  canvasLeftPadding,
  canvasRightPadding,
  championBackgroundColor,
  championBoxHeight,
  championBoxWidth,
  championConnectionLineWidth,
  championNameFontSize,
  championStrokeWidth,
  championTextPaddingX,
  championTextWidth,
  championTitleBackgroundColor,
  championToFinalGap,
  championTopMargin,
  connectionLineColor,
  connectionLineWidth,
  crownIconFontSize,
  crownIconOffsetX,
  debugInfoBackgroundColor,
  debugInfoTextColor,
  drawingLineCap,
  drawingLineJoin,
  DrawingMode,
  drawingModeIndicatorBackgroundColor,
  drawingModeIndicatorBorderColor,
  drawingModeIndicatorDotColor,
  drawingModeIndicatorTextColor,
  drawingStrokeColor,
  drawingStrokeWidth,
  EditMode,
  fullscreenPositionX,
  fullscreenPositionY,
  fullscreenScale,
  gamerSpacing,
  headerHeight,
  highlightColor,
  mainLayerName,
  maxZoom,
  minZoom,
  optimalPositionX,
  optimalPositionY,
  optimalScale,
  qrCodeOffsetX,
  qrCodeOffsetY,
  qrCodeSize,
  roundHeight,
  roundTitleBackgroundColor,
  roundTitleFontSize,
  roundTitleTextColor,
  sceneHeightExtra,
  strokeColor,
  textColor,
  titlePadding,
  titleWidth,
  zoomStep,
} from './constants';
import EditableKonvaMatch from './EditableKonvaMatch';
import { DrawingData, DrawingLine, GamerEditState, SingleEliminationKonvaProps } from './interfaces';

interface StageConfig {
  width: number;
  height: number;
  scale: number;
}

interface Position {
  x: number;
  y: number;
}

interface PositionCache {
  [key: string]: Position;
}

interface MousePoint {
  x: number;
  y: number;
}

export interface SingleEliminationKonvaRef {
  setOptimalView: () => void;
  setFullscreenView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setDrawingMode: (mode: DrawingMode) => void;
  clearDrawing: () => void;
  setEditMode: (mode: EditMode) => void;
}

const SingleEliminationKonva = forwardRef<SingleEliminationKonvaRef, SingleEliminationKonvaProps>(
  (
    {
      gamers,
      matches,
      isEditMode,
      onMatchUpdate,
      drawingData,
      onDrawingUpdate,
      editMode = EditMode.NORMAL,
      onGamerNameEdit,
      onGamerGamesEdit,
    },
    ref
  ) => {
    const rounds = Math.floor(Math.log2(gamers.length));
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const drawingLayerRef = useRef<Konva.Layer>(null);

    const [drawingMode, setDrawingMode] = useState<DrawingMode>(DrawingMode.NORMAL);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
    const [localDrawingData, setLocalDrawingData] = useState<DrawingData>(
      drawingData || { lines: [], lastUpdated: Date.now() }
    );
    const [currentEditMode, setCurrentEditMode] = useState<EditMode>(editMode);
    const [gamerEditState, setGamerEditState] = useState<GamerEditState>({
      gamerId: null,
      tempName: '',
      isEditing: false,
    });

    const firstRoundMatches = gamers.length / 2;
    const matchesAreaWidth = firstRoundMatches * gamerSpacing;
    const sceneWidth = titleWidth + canvasLeftPadding + matchesAreaWidth + canvasRightPadding;
    const sceneHeight = rounds * roundHeight + headerHeight + boxHeight + canvasBottomPadding + sceneHeightExtra;

    const [stageConfig, setStageConfig] = useState<StageConfig>({
      width: sceneWidth,
      height: sceneHeight,
      scale: 1,
    });

    const handleGamerGamesEdit = useCallback(
      (gamerId: number, newGames: number) => {
        if (!onGamerNameEdit) return; // 可以重用同一個回調或創建新的

        // 這裡需要更新 gamers 數組中對應 gamer 的 games 值
        // 實際實現會依賴於父組件如何處理這個更新
        if (onGamerGamesEdit) {
          onGamerGamesEdit(gamerId, newGames);
        }
      },
      [onGamerGamesEdit, onGamerNameEdit]
    );

    const handleGamerDoubleClick = useCallback(
      (gamer: Gamer) => {
        if (currentEditMode !== EditMode.GAMER_EDIT || !isEditMode) return;

        setGamerEditState({
          gamerId: gamer.id,
          tempName: gamer.name,
          isEditing: true,
        });
      },
      [currentEditMode, isEditMode]
    );

    const confirmGamerEdit = useCallback(
      (newName: string) => {
        if (!gamerEditState.isEditing || !gamerEditState.gamerId || !onGamerNameEdit) return;

        onGamerNameEdit(gamerEditState.gamerId, newName);
        setGamerEditState({
          gamerId: null,
          tempName: '',
          isEditing: false,
        });
      },
      [onGamerNameEdit, gamerEditState]
    );

    const cancelGamerEdit = useCallback(() => {
      setGamerEditState({
        gamerId: null,
        tempName: '',
        isEditing: false,
      });
    }, []);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!gamerEditState.isEditing) return;

        if (e.key === 'Enter') {
          confirmGamerEdit(gamerEditState.tempName);
        } else if (e.key === 'Escape') {
          cancelGamerEdit();
        }
      },
      [gamerEditState.isEditing, gamerEditState.tempName, confirmGamerEdit, cancelGamerEdit]
    );

    const handleSetEditMode = useCallback(
      (mode: EditMode) => {
        setCurrentEditMode(mode);
        if (mode !== EditMode.GAMER_EDIT) {
          cancelGamerEdit();
        }
      },
      [cancelGamerEdit]
    );

    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
      setCurrentEditMode(editMode);
    }, [editMode]);

    useEffect(() => {
      if (drawingData) {
        if (
          drawingData.lastUpdated !== localDrawingData.lastUpdated ||
          drawingData.lines.length !== localDrawingData.lines.length
        ) {
          setLocalDrawingData(drawingData);
        }
      } else {
        setLocalDrawingData({ lines: [], lastUpdated: Date.now() });
      }
    }, [drawingData, localDrawingData.lastUpdated, localDrawingData.lines.length]);

    const updateStageSize = useCallback((): void => {
      if (!containerRef.current) return;

      const containerWidth: number = containerRef.current.offsetWidth;
      const containerHeight: number = containerRef.current.offsetHeight;

      setStageConfig({
        width: containerWidth,
        height: containerHeight,
        scale: 1,
      });
    }, []);

    const setOptimalView = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      stage.scale({ x: optimalScale, y: optimalScale });
      stage.position({ x: optimalPositionX, y: optimalPositionY });
    }, []);

    const setFullscreenView = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      stage.scale({ x: fullscreenScale, y: fullscreenScale });
      stage.position({ x: fullscreenPositionX, y: fullscreenPositionY });
    }, []);

    const handleZoomIn = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      const currentScale = stage.scaleX();
      const newScale = Math.min(currentScale + zoomStep, maxZoom);
      stage.scale({ x: newScale, y: newScale });
    }, []);

    const handleZoomOut = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      const currentScale = stage.scaleX();
      const newScale = Math.max(currentScale - zoomStep, minZoom);
      stage.scale({ x: newScale, y: newScale });
    }, []);

    const handleSetDrawingMode = useCallback((mode: DrawingMode): void => {
      setDrawingMode(mode);
      setIsDrawing(false);
      setCurrentLine(null);
    }, []);

    const clearDrawing = useCallback((): void => {
      const newDrawingData: DrawingData = {
        lines: [],
        lastUpdated: Date.now(),
      };

      setLocalDrawingData(newDrawingData);

      if (onDrawingUpdate) {
        onDrawingUpdate(newDrawingData);
      }
    }, [onDrawingUpdate]);

    const handleMouseDown = useCallback((): void => {
      if (drawingMode !== DrawingMode.DRAWING || !isEditMode) return;

      setIsDrawing(true);
      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const relativePos = transform.point(pos);

      const newLine: DrawingLine = {
        id: `drawing-${Date.now()}-${Math.random()}`,
        points: [relativePos.x, relativePos.y],
        strokeWidth: drawingStrokeWidth,
        stroke: drawingStrokeColor,
        timestamp: Date.now(),
      };

      setCurrentLine(newLine);
    }, [drawingMode, isEditMode]);

    const handleMouseMove = useCallback((): void => {
      if (drawingMode !== DrawingMode.DRAWING || !isDrawing || !currentLine) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const relativePos = transform.point(pos);

      const updatedLine: DrawingLine = {
        ...currentLine,
        points: [...currentLine.points, relativePos.x, relativePos.y],
      };

      setCurrentLine(updatedLine);
    }, [drawingMode, isDrawing, currentLine]);

    const handleMouseUp = useCallback((): void => {
      if (drawingMode !== DrawingMode.DRAWING || !isDrawing || !currentLine) return;

      setIsDrawing(false);

      const newDrawingData: DrawingData = {
        lines: [...localDrawingData.lines, currentLine],
        lastUpdated: Date.now(),
      };

      setLocalDrawingData(newDrawingData);
      setCurrentLine(null);

      if (onDrawingUpdate) {
        onDrawingUpdate(newDrawingData);
      }
    }, [drawingMode, isDrawing, currentLine, localDrawingData, onDrawingUpdate]);

    const handleWheel = useCallback(
      (e: Konva.KonvaEventObject<WheelEvent>): void => {
        if (drawingMode === DrawingMode.DRAWING) return;

        e.evt.preventDefault();

        const stage: Konva.Stage | null = stageRef.current;
        if (!stage) return;

        const oldScale: number = stage.scaleX();
        const pointer: MousePoint = stage.getPointerPosition() || { x: 0, y: 0 };

        const mousePointTo: MousePoint = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };

        const direction: number = e.evt.deltaY > 0 ? -1 : 1;
        const scaleBy = 1.05;
        const newScale: number = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale: number = Math.max(minZoom, Math.min(newScale, maxZoom));

        stage.scale({ x: clampedScale, y: clampedScale });

        const newPos: MousePoint = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };

        stage.position(newPos);
      },
      [drawingMode]
    );

    const generateSingleEliminationMatches = useCallback((gamerList: Gamer[]): Match[] => {
      const matchList: Match[] = [];
      const totalRounds: number = Math.floor(Math.log2(gamerList.length));

      for (let i = 0; i < gamerList.length; i += 2) {
        matchList.push({
          id: `round1-match${i / 2}`,
          gamer1: gamerList[i],
          gamer2: gamerList[i + 1] || null,
          winner: null,
          round: 1,
          matchIndex: i / 2,
        });
      }

      for (let round = 2; round <= totalRounds; round++) {
        const prevRoundMatches: number = Math.pow(2, totalRounds - round + 1);
        const currentRoundMatches: number = prevRoundMatches / 2;

        for (let i = 0; i < currentRoundMatches; i++) {
          matchList.push({
            id: `round${round}-match${i}`,
            gamer1: null,
            gamer2: null,
            winner: null,
            round,
            matchIndex: i,
          });
        }
      }

      return matchList;
    }, []);

    const canMatchProceed = useCallback((match: Match): boolean => {
      return match.gamer1 !== null && match.gamer2 !== null;
    }, []);

    const clearGamerFromFutureMatches = useCallback(
      (gamerToClear: Gamer, fromRound: number, prevMatches: Match[]): Match[] => {
        return prevMatches.map((match: Match): Match => {
          if (match.round > fromRound) {
            const updatedMatch: Match = { ...match };

            if (updatedMatch.gamer1?.id === gamerToClear.id) {
              updatedMatch.gamer1 = null;
            }
            if (updatedMatch.gamer2?.id === gamerToClear.id) {
              updatedMatch.gamer2 = null;
            }

            if (updatedMatch.winner?.id === gamerToClear.id) {
              updatedMatch.winner = null;
            }

            return updatedMatch;
          }
          return match;
        });
      },
      []
    );

    const advanceWinner = useCallback(
      (matchId: string, selectedGamer: Gamer): void => {
        if (currentEditMode === EditMode.GAMER_EDIT) return;
        if (drawingMode === DrawingMode.DRAWING) return;
        if (!onMatchUpdate) return;

        const currentMatch: Match | undefined = matches.find((m: Match) => m.id === matchId);
        if (!currentMatch) return;

        if (currentMatch.round > 1 && !canMatchProceed(currentMatch)) {
          return;
        }

        if (currentMatch.winner?.id === selectedGamer.id) {
          const updatedMatches: Match[] = matches.map(
            (match: Match): Match => (match.id === matchId ? { ...match, winner: null } : match)
          );
          const finalMatches: Match[] = clearGamerFromFutureMatches(selectedGamer, currentMatch.round, updatedMatches);
          onMatchUpdate(finalMatches);
          return;
        }

        let updatedMatches: Match[] = matches;
        if (currentMatch.winner) {
          updatedMatches = clearGamerFromFutureMatches(currentMatch.winner, currentMatch.round, matches);
        }

        updatedMatches = updatedMatches.map(
          (match: Match): Match => (match.id === matchId ? { ...match, winner: selectedGamer } : match)
        );

        if (currentMatch.round < Math.floor(Math.log2(gamers.length))) {
          const nextRound: number = currentMatch.round + 1;
          const nextMatchIndex: number = Math.floor(currentMatch.matchIndex / 2);
          const nextMatchId = `round${nextRound}-match${nextMatchIndex}`;
          const isFirstSlot: boolean = currentMatch.matchIndex % 2 === 0;

          updatedMatches = updatedMatches.map((match: Match): Match => {
            if (match.id === nextMatchId) {
              return {
                ...match,
                [isFirstSlot ? 'gamer1' : 'gamer2']: selectedGamer,
              };
            }
            return match;
          });
        }
        onMatchUpdate(updatedMatches);
      },
      [currentEditMode, drawingMode, onMatchUpdate, matches, canMatchProceed, gamers.length, clearGamerFromFutureMatches]
    );

    const getRoundName = useCallback((roundNumber: number, totalRounds: number): string => {
      if (roundNumber === totalRounds) return '決賽';
      if (roundNumber === totalRounds - 1) return '準決賽';
      if (roundNumber === totalRounds - 2) return '八強賽';
      if (roundNumber === totalRounds - 3) return '十六強賽';
      return `第 ${roundNumber} 輪`;
    }, []);

    const matchPositions = useMemo((): PositionCache => {
      const positions: PositionCache = {};

      const calculatePosition = (round: number, matchIndex: number): Position => {
        const key = `${round}-${matchIndex}`;
        if (positions[key] !== undefined) {
          return positions[key];
        }

        if (round === 1) {
          const x: number = titleWidth + canvasLeftPadding + matchIndex * gamerSpacing + boxHeight;
          const y: number = headerHeight + (rounds - 1) * roundHeight + canvasBottomPadding - boxHeight + boxHeight / 2;
          positions[key] = { x, y };
        } else {
          const prevMatch1Index: number = matchIndex * 2;
          const prevMatch2Index: number = matchIndex * 2 + 1;

          const prevMatch1Pos: Position = calculatePosition(round - 1, prevMatch1Index);
          const prevMatch2Pos: Position = calculatePosition(round - 1, prevMatch2Index);

          const x: number = (prevMatch1Pos.x + prevMatch2Pos.x) / 2;
          const y: number = headerHeight + (rounds - round) * roundHeight + canvasBottomPadding - boxHeight + boxHeight / 2;

          positions[key] = { x, y };
        }

        return positions[key];
      };

      for (let round = 1; round <= rounds; round++) {
        const roundMatches: number = Math.pow(2, rounds - round);
        for (let matchIndex = 0; matchIndex < roundMatches; matchIndex++) {
          calculatePosition(round, matchIndex);
        }
      }

      return positions;
    }, [rounds]);

    const getMatchPosition = useCallback(
      (round: number, matchIndex: number): Position => {
        return matchPositions[`${round}-${matchIndex}`] || { x: 0, y: 0 };
      },
      [matchPositions]
    );

    const champion = useMemo((): Gamer | null => {
      const finalMatch: Match | undefined = matches.find((match: Match) => match.round === rounds);
      return finalMatch?.winner || null;
    }, [matches, rounds]);

    const qrCodePosition = useMemo(() => {
      return {
        x: titleWidth + qrCodeOffsetX,
        y: qrCodeOffsetY,
      };
    }, []);

    const championPosition = useMemo(() => {
      const finalMatchPos = getMatchPosition(rounds, 0);
      return {
        x: finalMatchPos.x + (boxWidth - championBoxWidth) / 2,
        y: headerHeight + championTopMargin,
      };
    }, [getMatchPosition, rounds]);

    const handleStageClick = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (gamerEditState.isEditing && e.target.getClassName() !== 'Html') {
          cancelGamerEdit();
        }
      },
      [gamerEditState.isEditing, cancelGamerEdit]
    );

    useImperativeHandle(ref, () => ({
      setOptimalView,
      setFullscreenView,
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      setDrawingMode: handleSetDrawingMode,
      clearDrawing,
      setEditMode: handleSetEditMode,
    }));

    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
      setCurrentEditMode(editMode);
    }, [editMode]);

    useEffect((): (() => void) => {
      updateStageSize();
      window.addEventListener('resize', updateStageSize);
      return (): void => {
        window.removeEventListener('resize', updateStageSize);
      };
    }, [updateStageSize]);

    useEffect(() => {
      const timer = setTimeout(() => {
        setOptimalView();
      }, 100);
      return () => clearTimeout(timer);
    }, [setOptimalView]);

    useEffect((): void => {
      if (matches.length === 0) {
        const initialMatches: Match[] = generateSingleEliminationMatches(gamers);
        if (onMatchUpdate) {
          onMatchUpdate(initialMatches);
        }
      }
    }, [generateSingleEliminationMatches, gamers, matches.length, onMatchUpdate]);

    return (
      <FiberProvider>
        <div ref={containerRef} className="w-full h-full relative" style={{ backgroundColor: canvasBackgroundColor }}>
          <Stage
            width={stageConfig.width}
            height={stageConfig.height}
            ref={stageRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onClick={handleStageClick}
            draggable={drawingMode === DrawingMode.NORMAL && currentEditMode === EditMode.NORMAL}
          >
            <Layer name={mainLayerName}>
              <QRCodeCanvas x={qrCodePosition.x} y={qrCodePosition.y} size={qrCodeSize} />

              {Array.from({ length: rounds }, (_, roundIndex: number) => {
                const roundNumber: number = roundIndex + 1;
                const titleY: number =
                  headerHeight +
                  (rounds - roundNumber) * roundHeight +
                  canvasBottomPadding -
                  boxHeight +
                  boxHeight / 2 -
                  titlePadding +
                  roundHeight / 2;

                return (
                  <Group key={`title-group-${roundNumber}`}>
                    <Rect
                      x={0}
                      y={titleY}
                      width={titleWidth}
                      height={headerHeight}
                      fill={roundTitleBackgroundColor}
                      stroke={strokeColor}
                      strokeWidth={1}
                      cornerRadius={4}
                    />
                    <Text
                      x={titlePadding}
                      y={titleY + titlePadding}
                      text={getRoundName(roundNumber, rounds)}
                      fontSize={roundTitleFontSize}
                      fontFamily="Arial"
                      fontStyle="bold"
                      fill={roundTitleTextColor}
                      width={titleWidth - titlePadding * 2}
                      align="center"
                      verticalAlign="middle"
                      wrap="none"
                    />
                  </Group>
                );
              })}

              <Group>
                <Rect
                  x={0}
                  y={0}
                  width={titleWidth}
                  height={headerHeight}
                  fill={championTitleBackgroundColor}
                  stroke={highlightColor}
                  strokeWidth={championStrokeWidth - 1}
                  cornerRadius={4}
                />
                <Text
                  x={titlePadding}
                  y={titlePadding}
                  text="🏆 冠軍"
                  fontSize={roundTitleFontSize}
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill={roundTitleTextColor}
                  width={titleWidth - titlePadding * 2}
                  align="center"
                  verticalAlign="middle"
                  wrap="none"
                />
              </Group>

              {matches.map((match: Match) => {
                const pos: Position = getMatchPosition(match.round, match.matchIndex);
                return (
                  <EditableKonvaMatch
                    key={match.id}
                    match={match}
                    x={pos.x}
                    y={pos.y + championToFinalGap}
                    onGamerClick={advanceWinner}
                    onGamerDoubleClick={handleGamerDoubleClick}
                    isEditMode={isEditMode && drawingMode === DrawingMode.NORMAL}
                    editMode={currentEditMode}
                    gamerEditState={gamerEditState}
                    onConfirmEdit={confirmGamerEdit}
                    onCancelEdit={cancelGamerEdit}
                    onGamesEdit={handleGamerGamesEdit}
                  />
                );
              })}

              {champion && (
                <Line
                  points={[
                    getMatchPosition(rounds, 0).x + boxWidth / 2,
                    getMatchPosition(rounds, 0).y + championToFinalGap,
                    getMatchPosition(rounds, 0).x + boxWidth / 2,
                    championPosition.y,
                  ]}
                  stroke={connectionLineColor}
                  strokeWidth={championConnectionLineWidth}
                />
              )}

              {champion && (
                <Group>
                  <Rect
                    x={championPosition.x}
                    y={0}
                    width={championBoxWidth}
                    height={championBoxHeight}
                    fill={championBackgroundColor}
                    stroke={highlightColor}
                    strokeWidth={championStrokeWidth}
                    cornerRadius={4}
                  />
                  <Text
                    x={championPosition.x + championTextPaddingX}
                    y={(championBoxHeight - championNameFontSize) / 2}
                    text={champion.name}
                    fontSize={championNameFontSize}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill={textColor}
                    width={championTextWidth}
                    ellipsis
                    wrap="none"
                    align="center"
                    verticalAlign="middle"
                  />
                  <Text
                    x={championPosition.x + championBoxWidth - crownIconOffsetX}
                    y={(championBoxHeight - crownIconFontSize) / 2}
                    text="👑"
                    fontSize={crownIconFontSize}
                  />
                </Group>
              )}

              {Array.from({ length: rounds - 1 }, (_, roundIndex: number) => {
                const currentRound: number = roundIndex + 1;
                const nextRound: number = currentRound + 1;
                const nextRoundMatches: Match[] = matches.filter((m: Match) => m.round === nextRound);

                return nextRoundMatches
                  .map((nextMatch: Match) => {
                    const firstMatchIndex: number = nextMatch.matchIndex * 2;
                    const secondMatchIndex: number = nextMatch.matchIndex * 2 + 1;

                    const firstMatch: Match | undefined = matches.find(
                      (m: Match) => m.round === currentRound && m.matchIndex === firstMatchIndex
                    );
                    const secondMatch: Match | undefined = matches.find(
                      (m: Match) => m.round === currentRound && m.matchIndex === secondMatchIndex
                    );

                    if (!firstMatch?.winner || !secondMatch?.winner) return null;

                    const firstPos: Position = getMatchPosition(currentRound, firstMatchIndex);
                    const secondPos: Position = getMatchPosition(currentRound, secondMatchIndex);
                    const nextPos: Position = getMatchPosition(nextRound, nextMatch.matchIndex);

                    const firstMatchCenterX: number = firstPos.x + boxWidth / 2;
                    const firstMatchTopY: number = firstPos.y + championToFinalGap;
                    const secondMatchCenterX: number = secondPos.x + boxWidth / 2;
                    const secondMatchTopY: number = secondPos.y + championToFinalGap;
                    const nextMatchCenterX: number = nextPos.x + boxWidth / 2;
                    const nextMatchBottomY: number = nextPos.y + boxHeight + championToFinalGap;
                    const midY: number = (firstMatchTopY + nextMatchBottomY) / 2;

                    return (
                      <Group key={`connector-group-${currentRound}-${nextMatch.matchIndex}`}>
                        <Line
                          points={[firstMatchCenterX, firstMatchTopY, firstMatchCenterX, midY]}
                          stroke={connectionLineColor}
                          strokeWidth={connectionLineWidth}
                        />
                        <Line
                          points={[secondMatchCenterX, secondMatchTopY, secondMatchCenterX, midY]}
                          stroke={connectionLineColor}
                          strokeWidth={connectionLineWidth}
                        />
                        <Line
                          points={[firstMatchCenterX, midY, secondMatchCenterX, midY]}
                          stroke={connectionLineColor}
                          strokeWidth={connectionLineWidth}
                        />
                        <Line
                          points={[nextMatchCenterX, midY, nextMatchCenterX, nextMatchBottomY]}
                          stroke={connectionLineColor}
                          strokeWidth={connectionLineWidth}
                        />
                      </Group>
                    );
                  })
                  .filter((item): item is JSX.Element => item !== null);
              }).flat()}
            </Layer>

            <Layer ref={drawingLayerRef} listening={false}>
              {localDrawingData.lines.map((line: DrawingLine) => {
                if (!line.points || line.points.length < 4) {
                  return null;
                }

                return (
                  <Line
                    key={line.id}
                    points={line.points}
                    stroke={line.stroke}
                    strokeWidth={line.strokeWidth}
                    tension={0.5}
                    lineCap={drawingLineCap}
                    lineJoin={drawingLineJoin}
                    globalCompositeOperation="source-over"
                  />
                );
              })}

              {currentLine && (
                <Line
                  points={currentLine.points}
                  stroke={currentLine.stroke}
                  strokeWidth={currentLine.strokeWidth}
                  tension={0.5}
                  lineCap={drawingLineCap}
                  lineJoin={drawingLineJoin}
                  globalCompositeOperation="source-over"
                />
              )}
            </Layer>
          </Stage>

          {drawingMode === DrawingMode.DRAWING && (
            <div
              className="absolute top-4 left-4 z-10 rounded-lg px-3 py-2"
              style={{
                backgroundColor: drawingModeIndicatorBackgroundColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: drawingModeIndicatorBorderColor,
              }}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: drawingModeIndicatorDotColor }}
                ></div>
                <span className="text-sm font-medium" style={{ color: drawingModeIndicatorTextColor }}>
                  繪圖模式
                </span>
              </div>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && (
            <div
              className="absolute bottom-4 left-4 z-10 p-2 rounded text-xs"
              style={{
                backgroundColor: debugInfoBackgroundColor,
                color: debugInfoTextColor,
              }}
            >
              <div>本地線條: {localDrawingData.lines.length}</div>
              <div>外部線條: {drawingData?.lines?.length || 0}</div>
            </div>
          )}
        </div>
      </FiberProvider>
    );
  }
);

SingleEliminationKonva.displayName = 'SingleEliminationKonva';

export default SingleEliminationKonva;
