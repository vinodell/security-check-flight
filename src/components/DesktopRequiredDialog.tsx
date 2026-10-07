import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy, Monitor, ShieldAlert } from "lucide-react";
import SecuritySirens from "./SecuritySirens";
import "./SecurityCheckDialog.css";
import "./DesktopRequiredDialog.css";

type CopyState = "idle" | "copied" | "error";

export default function DesktopRequiredDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotion();
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (dialog && !dialog.open) dialog.showModal();
    headingRef.current?.focus({ preventScroll: true });

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="security-dialog desktop-required-dialog"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-labelledby="desktop-required-title"
      aria-describedby="desktop-required-description"
      onCancel={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.preventDefault();
      }}
      onClose={() => {
        // Some browsers force-close after repeated native dismiss requests.
        const dialog = dialogRef.current;
        if (dialog?.isConnected && !dialog.open) {
          dialog.showModal();
          headingRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <motion.div
        className="security-dialog-content desktop-required-content"
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <header className="security-dialog-header desktop-required-header">
          <div>
            <span className="security-eyebrow">
              <ShieldAlert aria-hidden="true" /> AVA · SECURITY CHECK
            </span>
            <h2 id="desktop-required-title" ref={headingRef} tabIndex={-1}>
              Проверка только на компьютере.
            </h2>
          </div>
          <span className="desktop-required-device" aria-hidden="true">
            <Monitor />
          </span>
        </header>

        <div className="security-stage desktop-required-stage">
          <div className="security-light-sweep security-light-sweep--red" />
          <div className="security-light-sweep security-light-sweep--blue" />
          <div className="security-stage-grid" />
          <div className="security-stage-topline" aria-hidden="true">
            <span>TERMINAL SECURITY</span>
            <span className="desktop-required-status">DESKTOP ONLY</span>
          </div>
          <SecuritySirens />
          <figure className="desktop-required-photo">
            <img
              src={`${import.meta.env.BASE_URL}security.jpg`}
              width="300"
              height="203"
              alt="Сотрудник службы безопасности"
            />
          </figure>
          <div className="desktop-required-stage-caption" aria-hidden="true">
            <span /> ДОПУСК С ТЕЛЕФОНА ЗАКРЫТ
          </div>
        </div>

        <footer className="desktop-required-footer">
          <p id="desktop-required-description">
            Откройте этот сайт на <strong>компьютере или ноутбуке</strong>,
            чтобы пройти security check.
          </p>
          <motion.button
            className="security-continue desktop-required-copy"
            onClick={copyLink}
            whileHover={reducedMotion ? undefined : { y: -2 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          >
            {copyState === "copied" ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copyState === "copied"
              ? "Ссылка скопирована"
              : "Скопировать ссылку"}
          </motion.button>
          <p
            className="desktop-required-copy-feedback"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {copyState === "error"
              ? "Не удалось скопировать. Перешлите адрес сайта из строки браузера."
              : copyState === "copied"
                ? "Отправьте ссылку себе и откройте её на компьютере."
                : "AVA MARIA, AVA VICTORIA"}
          </p>
        </footer>
      </motion.div>
    </dialog>
  );
}
