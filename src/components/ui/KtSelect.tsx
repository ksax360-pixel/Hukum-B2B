"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type KtSelectOption = {
  value: string;
  label: string;
};

type Props = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  options: KtSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

type MenuPos = { top: number; left: number; width: number; maxHeight: number; openUp: boolean };

export function KtSelect({
  id,
  name,
  value,
  defaultValue = "",
  options,
  placeholder = "Select…",
  required,
  disabled,
  className,
  onChange,
}: Props) {
  const autoId = useId();
  const fieldId = id || autoId;
  const listId = `${fieldId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = value !== undefined ? value : internal;

  const selectedLabel = useMemo(() => {
    const hit = options.find((o) => o.value === selected);
    return hit?.label;
  }, [options, selected]);

  useEffect(() => setMounted(true), []);

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    const spaceAbove = rect.top - gap - 12;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(280, Math.max(140, openUp ? spaceAbove : spaceBelow));
    setPos({
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(
      0,
      options.findIndex((o) => o.value === selected)
    );
    setActiveIndex(idx);
  }, [open, options, selected]);

  const commit = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, Math.max(0, i) + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, (i < 0 ? 0 : i) - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIndex >= 0 && options[activeIndex]) commit(options[activeIndex].value);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    }
  };

  const menu =
    mounted &&
    open &&
    pos &&
    createPortal(
      <div
        ref={menuRef}
        id={listId}
        role="listbox"
        tabIndex={-1}
        aria-labelledby={fieldId}
        className={cn("kt-select__menu", pos.openUp && "kt-select__menu--up")}
        style={{
          position: "fixed",
          top: pos.openUp ? undefined : pos.top,
          bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
          left: pos.left,
          width: pos.width,
          maxHeight: pos.maxHeight,
          zIndex: 200,
        }}
        onKeyDown={onMenuKey}
      >
        {options.length === 0 ? (
          <div className="kt-select__empty">No options</div>
        ) : (
          options.map((opt, i) => {
            const isSelected = opt.value === selected;
            const isActive = i === activeIndex;
            return (
              <button
                key={`${opt.value}-${i}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "kt-select__option",
                  isSelected && "is-selected",
                  isActive && "is-active"
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(opt.value)}
              >
                <span className="kt-select__option-label">{opt.label}</span>
                {isSelected ? <Check size={14} strokeWidth={2} className="kt-select__check" /> : null}
              </button>
            );
          })
        )}
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={cn("kt-select", open && "is-open", className)}>
      {name ? <input type="hidden" name={name} value={selected} required={required && !selected} /> : null}
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        className="kt-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
      >
        <span className={cn("kt-select__value", !selectedLabel && "is-placeholder")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={15} strokeWidth={1.75} className="kt-select__chevron" />
      </button>
      {menu}
    </div>
  );
}
