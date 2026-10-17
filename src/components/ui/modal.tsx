"use client";

import React, { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  icon,
  footer,
  maxWidth = "md",
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Prevent body scrolling
      document.body.style.overflow = "hidden";

      // Focus first actionable element inside modal or modal itself
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
        previousActiveElement.current?.focus();
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202723]/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "relative w-full max-h-[calc(100dvh-2rem)] flex flex-col rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-2xl shadow-[#202723]/15 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 focus:outline-none",
          maxWidthClasses
        )}
      >
        {/* Scrollable Body Container */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 flex items-start gap-3.5">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}

            <div className="flex-1 min-w-0 pr-4">
              <h3
                id="modal-title"
                className="font-display text-xl font-bold text-[#202723] tracking-tight"
              >
                {title}
              </h3>
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-[#202723]/70 leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-[#202723]/40 hover:text-[#202723] p-1.5 rounded-lg hover:bg-[#202723]/05 transition-colors absolute top-4 right-4"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          {children && <div className="px-5 sm:px-6 py-2">{children}</div>}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-6 pt-3 bg-[#F2F2EB]/50 border-t border-[#DDDCD3]/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  isLoading?: boolean;
  icon?: ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  isLoading = false,
  icon,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      description={description}
      icon={icon}
      maxWidth="md"
      showCloseButton={!isLoading}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-[#DDDCD3] text-[#202723] hover:bg-[#202723]/05"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "forest"}
            onClick={onConfirm}
            isLoading={isLoading}
            className="font-semibold px-5"
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
