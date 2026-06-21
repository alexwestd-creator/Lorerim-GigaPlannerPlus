import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { SelectItem } from "@/components/ui/select";

const CLOSE_DELAY_MS = 80;

interface ActiveDetail {
  value: string;
  detail: ReactNode;
  top: number;
  left: number;
}

interface SelectHoverDetailContextValue {
  enterItem: (value: string, detail: ReactNode, element: HTMLElement) => void;
  leaveItem: (event: PointerEvent<HTMLElement>) => void;
  enterPanel: () => void;
  leavePanel: () => void;
}

const SelectHoverDetailContext = createContext<SelectHoverDetailContextValue | null>(null);

function isMovingToDetailPanel(relatedTarget: EventTarget | null): boolean {
  return (
    relatedTarget instanceof Element && relatedTarget.closest("[data-select-detail-panel]") !== null
  );
}

function isMovingWithinListbox(
  event: PointerEvent<HTMLElement>,
  relatedTarget: EventTarget | null,
): boolean {
  if (!(relatedTarget instanceof Node)) return false;
  const listbox = event.currentTarget.closest('[role="listbox"]');
  return listbox?.contains(relatedTarget) ?? false;
}

export function SelectHoverDetailRoot({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveDetail | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const hideImmediate = useCallback(() => {
    clearCloseTimer();
    setActive(null);
  }, [clearCloseTimer]);

  const hideDelayed = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(hideImmediate, CLOSE_DELAY_MS);
  }, [clearCloseTimer, hideImmediate]);

  const enterItem = useCallback(
    (value: string, detail: ReactNode, element: HTMLElement) => {
      clearCloseTimer();
      const rect = element.getBoundingClientRect();
      setActive({
        value,
        detail,
        top: rect.top,
        left: rect.right + 6,
      });
    },
    [clearCloseTimer],
  );

  const leaveItem = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const { relatedTarget } = event;
      if (isMovingWithinListbox(event, relatedTarget) || isMovingToDetailPanel(relatedTarget)) {
        return;
      }
      hideDelayed();
    },
    [hideDelayed],
  );

  const enterPanel = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => () => hideImmediate(), [hideImmediate]);

  return (
    <SelectHoverDetailContext.Provider
      value={{ enterItem, leaveItem, enterPanel, leavePanel: hideDelayed }}
    >
      {children}
      {active &&
        createPortal(
          <div
            data-select-detail-panel
            className="z-[300] w-[min(40rem,calc(100vw-2rem))] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-panel)]"
            style={{ position: "fixed", top: active.top, left: active.left }}
            onPointerEnter={enterPanel}
            onPointerLeave={hideDelayed}
            onPointerDown={(e) => e.preventDefault()}
          >
            {active.detail}
          </div>,
          document.body,
        )}
    </SelectHoverDetailContext.Provider>
  );
}

interface SelectItemWithDetailProps {
  value: string;
  children: ReactNode;
  detail?: ReactNode;
}

export function SelectItemWithDetail({ value, children, detail }: SelectItemWithDetailProps) {
  const ctx = useContext(SelectHoverDetailContext);

  if (!detail || !ctx) {
    return <SelectItem value={value}>{children}</SelectItem>;
  }

  const { enterItem, leaveItem } = ctx;

  return (
    <SelectItem
      value={value}
      onPointerEnter={(e) => enterItem(value, detail, e.currentTarget)}
      onPointerLeave={leaveItem}
      onFocus={(e) => enterItem(value, detail, e.currentTarget)}
    >
      {children}
    </SelectItem>
  );
}
