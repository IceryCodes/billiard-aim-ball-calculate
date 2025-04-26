import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Slider from '@/global-components/sliders/Slider';
import Tooltip from '@/global-components/tooltips/Tooltip';

interface ControlPanelProps {
  showLabel: boolean;
  setShowLabel: (showLabel: boolean) => void;
  showMark: boolean;
  setShowMark: (showMark: boolean) => void;
  showDot: boolean;
  setShowDot: (showDot: boolean) => void;
  textSize: { label: number; angle: number; mark: number };
  setTextSize: (textSize: { label: number; angle: number; mark: number }) => void;
  positionRangeValue: number;
  setPositionRangeValue: (positionRangeValue: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  showLabel,
  setShowLabel,
  showMark,
  setShowMark,
  showDot,
  setShowDot,
  textSize,
  setTextSize,
  positionRangeValue,
  setPositionRangeValue,
}) => {
  const textSizeScale = (scaleUp: boolean) => {
    if (scaleUp) {
      setTextSize({
        label: textSize.label + 1,
        angle: textSize.angle + 1,
        mark: textSize.mark + 1,
      });
    } else {
      setTextSize({
        label: textSize.label - 1,
        angle: textSize.angle - 1,
        mark: textSize.mark - 1,
      });
    }
  };

  return (
    <>
      <div className="flex flex-row gap-x-4 items-center mt-4">
        <Button
          onClick={() => textSizeScale(true)}
          element={<>A</>}
          className="bg-link hover:scale-105 text-background px-4 py-2 rounded-lg text-center"
        />
        <Button
          onClick={() => textSizeScale(false)}
          element={<>A</>}
          className="bg-link hover:scale-105 text-background px-3 py-1 rounded-lg text-center text-sm"
        />
        <input type="checkbox" checked={showLabel} onChange={() => setShowLabel(!showLabel)} />
        <span className="text-background">文字</span>
        <input type="checkbox" checked={showMark} onChange={() => setShowMark(!showMark)} />
        <span className="text-background">記號</span>
        <input type="checkbox" checked={showDot} onChange={() => setShowDot(!showDot)} />
        <span className="text-background">圓點</span>
      </div>

      {/* Angle Slider */}
      <section
        style={{
          backgroundColor: 'white',
          borderRadius: 5,
          height: 20,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={positionRangeValue}
          defaultValue={0.5}
          onChange={(value: number) => setPositionRangeValue(value)}
          style={{ width: 330 }}
        />
      </section>

      {/* Quick Select Buttons */}
      <div className="flex flex-row gap-4">
        <Tooltip placement="bottom" title="直球">
          <Button
            buttonStyle={positionRangeValue === 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(0)}
            text="0°"
          />
        </Tooltip>
        <Tooltip placement="bottom" title="半顆">
          <Button
            buttonStyle={positionRangeValue === 0.5 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(0.5)}
            text="30°"
          />
        </Tooltip>
        <Tooltip placement="bottom" title="好打">
          <Button
            buttonStyle={positionRangeValue === 0.71 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(0.71)}
            text="45°"
          />
        </Tooltip>
        <Tooltip placement="bottom" title="難打">
          <Button
            buttonStyle={positionRangeValue === 0.87 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(0.87)}
            text="60°"
          />
        </Tooltip>
        <Tooltip placement="bottom" title="倚天切">
          <Button
            buttonStyle={positionRangeValue === 1 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(1)}
            text="90°"
          />
        </Tooltip>
      </div>
    </>
  );
};

export default ControlPanel;
