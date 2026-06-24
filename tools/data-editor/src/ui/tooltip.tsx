import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const TOOLTIP_OFFSET = 12;
const VIEWPORT_PADDING = 8;

function clampTooltipToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const maxX = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING);
  const maxY = Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING);
  return {
    x: Math.min(Math.max(x, VIEWPORT_PADDING), maxX),
    y: Math.min(Math.max(y, VIEWPORT_PADDING), maxY),
  };
}

const tooltipSurfaceClassName =
  "z-30 overflow-visible rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-foreground)] shadow-[var(--shadow-glow)]";

export function CursorTooltip({
  children,
  content,
  className,
  style,
}: {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateAnchor = (event: MouseEvent) => {
    setAnchor({
      x: event.clientX + TOOLTIP_OFFSET,
      y: event.clientY + TOOLTIP_OFFSET,
    });
  };

  useLayoutEffect(() => {
    if (!open || !tooltipRef.current) return;

    const el = tooltipRef.current;
    const updateDisplay = () => {
      const { width, height } = el.getBoundingClientRect();
      const clamped = clampTooltipToViewport(anchor.x, anchor.y, width, height);
      setPosition((prev) => {
        if (prev.x === clamped.x && prev.y === clamped.y) return prev;
        return clamped;
      });
    };

    updateDisplay();

    const observer = new ResizeObserver(updateDisplay);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, anchor]);

  return (
    <>
      <div
        className={className}
        style={style}
        onMouseEnter={(event) => {
          updateAnchor(event);
          setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        onMouseMove={updateAnchor}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={cn(
              tooltipSurfaceClassName,
              "pointer-events-none fixed max-w-xs",
            )}
            style={{ left: position.x, top: position.y }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
