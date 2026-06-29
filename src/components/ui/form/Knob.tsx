import React, {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clamp from "shared/lib/helpers/clamp";
import styled, { ThemeContext, css } from "styled-components";

interface KnobProps {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  labelledBy?: string;
  ariaLabel?: string;
  onChange?: (value: number) => void;
  sensitivity?: number;
  formatValue?: (value: number) => string;
}

type DragAxis = "horizontal" | "vertical" | null;

const KNOB_START_ANGLE = -135;
const KNOB_END_ANGLE = 135;
const KNOB_SWEEP = KNOB_END_ANGLE - KNOB_START_ANGLE;
const DEAD_ZONE_PX = 15;
const AXIS_SWITCH_DEAD_ZONE_PX = 24;
const PAGE_STEP_MULTIPLIER = 10;

const clampAndSnap = (
  value: number,
  min: number,
  max: number,
  step: number,
) => {
  const clamped = Math.min(Math.max(value, min), max);
  const snapped = Math.round((clamped - min) / step) * step + min;
  return Number(snapped.toFixed(10));
};

const normalizeValue = (value: number, min: number, max: number) => {
  if (max <= min) {
    return 0;
  }
  return (value - min) / (max - min);
};

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number,
) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
};

const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
};

const canTypeDecimal = (step: number) => !Number.isInteger(step);

const isDigitKey = (key: string) => /^[0-9]$/.test(key);

const Root = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

interface KnobButtonProps {
  $isDragging: boolean;
  $isEditing: boolean;
  $dragAxis: DragAxis;
}

const KnobButton = styled.button<KnobButtonProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 999px;
  background: ${(props) => props.theme.colors.input.background};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  color: ${(props) => props.theme.colors.text};
  cursor: ${(props) => {
    if (props.$isDragging) {
      if (props.$dragAxis === "horizontal") {
        return "ew-resize";
      }
      if (props.$dragAxis === "vertical") {
        return "ns-resize";
      }
      return "move";
    }
    return "grab";
  }};
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.highlight};
    outline-offset: 2px;
  }

  ${(props) =>
    props.$isDragging || props.$isEditing
      ? css`
          box-shadow: 0 0 0 1px ${props.theme.colors.highlight};
        `
      : ""}
`;

const KnobSvg = styled.svg`
  display: block;
  overflow: visible;
  pointer-events: none;
`;

const ValueOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  pointer-events: none;
  white-space: nowrap;
  padding: 2px 6px;
  font-size: 10px;
  opacity: 0.5;
  color: ${(props) => props.theme.colors.input.text};

  ${KnobButton}:focus + & {
    z-index: 10001;
    opacity: 1;
  }
`;

const EditInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 1px solid ${(props) => props.theme.colors.highlight};
  border-radius: 999px;
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.text};
  text-align: center;
  font-size: 12px;
  outline: 0;
  padding: 0 6px;
  box-sizing: border-box;
`;

const ShadowBorder = styled.div`
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 80px;
  box-shadow:
    0px 0px 3px 1px ${(props) => props.theme.colors.text} inset,
    0px 2px 10px ${(props) => props.theme.colors.input.border};
  opacity: 0.2;
`;

export const Knob = ({
  name,
  value,
  min,
  max,
  step = 1,
  labelledBy,
  ariaLabel,
  onChange,
  sensitivity = 0.02,
  formatValue,
}: KnobProps) => {
  const themeContext = useContext(ThemeContext);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartValueRef = useRef(0);
  const dragAxisRef = useRef<DragAxis>(null);
  const touchValue = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const [overlayValue, setOverlayValue] = useState<number | null>(null);
  const [dragAxisState, setDragAxisState] = useState<DragAxis>(null);

  const safeValue = clampAndSnap(value ?? 0, min, max, step);
  const displayValue = overlayValue ?? safeValue;
  const lastEmittedValueRef = useRef<number>(safeValue);

  useEffect(() => {
    lastEmittedValueRef.current = safeValue;
  }, [safeValue]);

  const displayText = useMemo(() => {
    return formatValue ? formatValue(displayValue) : `${displayValue}`;
  }, [displayValue, formatValue]);

  const ariaValueText = useMemo(() => {
    return formatValue ? formatValue(safeValue) : `${safeValue}`;
  }, [formatValue, safeValue]);

  const emitValueIfChanged = useCallback(
    (nextValue: number) => {
      const snapped = clampAndSnap(nextValue, min, max, step);

      if (snapped === lastEmittedValueRef.current) {
        return;
      }

      touchValue.current = null;
      lastEmittedValueRef.current = snapped;
      onChange?.(snapped);
    },
    [max, min, onChange, step],
  );

  const commitValue = useCallback(
    (nextValue: number) => {
      emitValueIfChanged(nextValue);
    },
    [emitValueIfChanged],
  );

  const beginEditing = useCallback((seed: string) => {
    setDraftValue(seed);
    setOverlayValue(null);
    setIsDragging(false);
    setIsEditing(true);
    dragAxisRef.current = null;
    setDragAxisState(null);
  }, []);

  const beginEditingWithCurrentValue = useCallback(() => {
    beginEditing(String(safeValue));
  }, [beginEditing, safeValue]);

  const cancelEditing = useCallback(() => {
    setDraftValue(String(safeValue));
    setIsEditing(false);
  }, [safeValue]);

  const commitDraft = useCallback(() => {
    const trimmed = draftValue.trim();

    if (trimmed === "") {
      setIsEditing(false);
      return;
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      setDraftValue(String(safeValue));
      setIsEditing(false);
      return;
    }

    commitValue(parsed);
    setIsEditing(false);
  }, [commitValue, draftValue, safeValue]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus();

    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, [isEditing]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (
        pointerIdRef.current !== null &&
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      const dx = event.clientX - dragStartXRef.current;
      const dy = dragStartYRef.current - event.clientY;

      if (dragAxisRef.current === null) {
        if (Math.abs(dx) < DEAD_ZONE_PX && Math.abs(dy) < DEAD_ZONE_PX) {
          return;
        }

        dragAxisRef.current =
          Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";

        dragStartXRef.current = event.clientX;
        dragStartYRef.current = event.clientY;
        dragStartValueRef.current = lastEmittedValueRef.current;

        setDragAxisState(dragAxisRef.current);
        return;
      }

      const currentAxis = dragAxisRef.current;
      const perpendicularDelta = currentAxis === "horizontal" ? dy : dx;

      if (Math.abs(perpendicularDelta) >= AXIS_SWITCH_DEAD_ZONE_PX) {
        const nextAxis =
          currentAxis === "horizontal" ? "vertical" : "horizontal";

        dragAxisRef.current = nextAxis;
        dragStartXRef.current = event.clientX;
        dragStartYRef.current = event.clientY;
        dragStartValueRef.current = lastEmittedValueRef.current;

        setDragAxisState(nextAxis);
        return;
      }

      const primaryDelta = currentAxis === "horizontal" ? dx : dy;
      const nextValue = clampAndSnap(
        dragStartValueRef.current + primaryDelta * sensitivity * (max - min),
        min,
        max,
        step,
      );

      setOverlayValue(nextValue);
      emitValueIfChanged(nextValue);
    };

    const finishDrag = (event?: PointerEvent) => {
      if (
        event &&
        pointerIdRef.current !== null &&
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      if (touchValue.current !== null) {
        const value = clampAndSnap(touchValue.current, min, max, step);
        commitValue(value);
      }

      pointerIdRef.current = null;
      dragAxisRef.current = null;
      setDragAxisState(null);
      setOverlayValue(null);
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [
    commitValue,
    emitValueIfChanged,
    isDragging,
    max,
    min,
    sensitivity,
    step,
  ]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (isEditing) {
        return;
      }

      event.currentTarget.focus();

      pointerIdRef.current = event.pointerId;
      dragStartXRef.current = event.clientX;
      dragStartYRef.current = event.clientY;
      dragStartValueRef.current = safeValue;
      dragAxisRef.current = null;
      touchValue.current = null;
      setDragAxisState(null);
      setOverlayValue(safeValue);
      setIsDragging(true);

      // Calculate value at touch start
      const rect = event.currentTarget.getBoundingClientRect();
      const relX = 2 * ((event.clientX - rect.left) / rect.width) - 1;
      const relY = 2 * ((event.clientY - rect.top) / rect.height) - 1;
      const length = Math.sqrt(relX * relX + relY * relY);

      if (length > 0.5) {
        const angle = Math.round(Math.atan2(relX, -relY) * (180 / Math.PI));
        const ratio = clamp((angle - KNOB_START_ANGLE) / KNOB_SWEEP, 0, 1);
        const value = clampAndSnap(min + (max - min) * ratio, min, max, step);
        touchValue.current = value;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [isEditing, max, min, safeValue, step],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (isEditing) {
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
        event.preventDefault();
        commitValue(safeValue + step);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
        event.preventDefault();
        commitValue(safeValue - step);
        return;
      }

      if (event.key === "PageUp") {
        event.preventDefault();
        commitValue(safeValue + step * PAGE_STEP_MULTIPLIER);
        return;
      }

      if (event.key === "PageDown") {
        event.preventDefault();
        commitValue(safeValue - step * PAGE_STEP_MULTIPLIER);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        commitValue(min);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        commitValue(max);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        beginEditingWithCurrentValue();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        beginEditing("");
        return;
      }

      if (isDigitKey(event.key)) {
        event.preventDefault();
        beginEditing(event.key);
        return;
      }

      if (event.key === "-" && min < 0) {
        event.preventDefault();
        beginEditing("-");
        return;
      }

      if (event.key === "." && canTypeDecimal(step)) {
        event.preventDefault();
        beginEditing("0.");
      }
    },
    [
      beginEditing,
      beginEditingWithCurrentValue,
      commitValue,
      isEditing,
      max,
      min,
      safeValue,
      step,
    ],
  );

  const onInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitDraft();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing();
      }
    },
    [cancelEditing, commitDraft],
  );

  const normalized = normalizeValue(safeValue, min, max);
  const valueAngle = KNOB_START_ANGLE + normalized * KNOB_SWEEP;

  const isBipolar = min < 0 && max > 0;
  const zeroNormalized = isBipolar ? normalizeValue(0, min, max) : 0;
  const zeroAngle = KNOB_START_ANGLE + zeroNormalized * KNOB_SWEEP;

  const backgroundColor = themeContext?.colors.input.background ?? "#000";
  const trackColor = themeContext?.colors.input.border ?? "#888";
  const fillColor = themeContext?.colors.highlight ?? "#fff";
  const pointerColor = themeContext?.colors.text ?? "#fff";

  const arcBackground = describeArc(
    30,
    30,
    25,
    KNOB_START_ANGLE,
    KNOB_END_ANGLE,
  );

  const arcValue = isBipolar
    ? safeValue === 0
      ? null
      : safeValue < 0
        ? describeArc(30, 30, 26, valueAngle, zeroAngle)
        : describeArc(30, 30, 26, zeroAngle, valueAngle)
    : safeValue > min
      ? describeArc(30, 30, 26, KNOB_START_ANGLE, valueAngle)
      : null;

  const pointerLength = 15;
  const pointerRadians = ((valueAngle - 90) * Math.PI) / 180;
  const pointerX = 30 + pointerLength * Math.cos(pointerRadians);
  const pointerY = 30 + pointerLength * Math.sin(pointerRadians);
  const pointerX2 = 30 + 20 * Math.cos(pointerRadians);
  const pointerY2 = 30 + 20 * Math.sin(pointerRadians);

  const zeroMarkerInner = polarToCartesian(30, 30, 26, zeroAngle);
  const zeroMarkerOuter = polarToCartesian(30, 30, 27, zeroAngle);

  return (
    <Root>
      <KnobButton
        id={name}
        name={name}
        type="button"
        role="slider"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={safeValue}
        aria-valuetext={ariaValueText}
        $isDragging={isDragging}
        $isEditing={isEditing}
        $dragAxis={dragAxisState}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onDoubleClick={beginEditingWithCurrentValue}
      >
        <KnobSvg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
          <path
            d={arcBackground}
            fill="none"
            stroke={trackColor}
            strokeWidth="5"
            strokeLinecap="square"
          />

          <circle
            cx={30}
            cy={30}
            r={24}
            fill="none"
            stroke={backgroundColor}
            strokeWidth="1"
          />

          {arcValue && (
            <path
              d={arcValue}
              fill="none"
              stroke={fillColor}
              strokeWidth="4"
              strokeLinecap="square"
            />
          )}

          {isBipolar && (
            <line
              x1={zeroMarkerInner.x}
              y1={zeroMarkerInner.y}
              x2={zeroMarkerOuter.x}
              y2={zeroMarkerOuter.y}
              stroke={backgroundColor}
              strokeWidth="4"
              strokeLinecap="square"
            />
          )}

          <circle
            cx={30}
            cy={30}
            r={23}
            fill="none"
            stroke={trackColor}
            strokeWidth="1"
          />

          <line
            x1={pointerX}
            y1={pointerY}
            x2={pointerX2}
            y2={pointerY2}
            stroke={pointerColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </KnobSvg>

        <ShadowBorder />

        {isEditing && (
          <EditInput
            ref={inputRef}
            value={draftValue}
            inputMode={canTypeDecimal(step) ? "decimal" : "numeric"}
            aria-label={ariaLabel ? `${ariaLabel} value` : "Knob value"}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={onInputKeyDown}
          />
        )}
      </KnobButton>
      {!isEditing && <ValueOverlay>{displayText}</ValueOverlay>}
    </Root>
  );
};
