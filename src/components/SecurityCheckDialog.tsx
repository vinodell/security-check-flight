import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, ShieldCheck, X } from "lucide-react";
import { FLIGHT } from "../domain/checkIn";
import SecuritySirens from "./SecuritySirens";
import "./SecurityCheckDialog.css";

type SecurityPhase = "arriving" | "torn" | "gate";

// The tear bends around the GATE field, keeping its revealed number on the left.
const LEFT_TEAR =
  "polygon(0 0, 50% 0, 49.3% 7%, 50.8% 15%, 49.1% 23%, 50.3% 32%, 48.9% 41%, 50.6% 48%, 51.9% 57%, 52.8% 64%, 52% 72%, 49.2% 79%, 50.8% 87%, 49.4% 94%, 50% 100%, 0 100%)";
const RIGHT_TEAR =
  "polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 49.4% 94%, 50.8% 87%, 49.2% 79%, 52% 72%, 52.8% 64%, 51.9% 57%, 50.6% 48%, 48.9% 41%, 50.3% 32%, 49.1% 23%, 50.8% 15%, 49.3% 7%)";

export default function SecurityCheckDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [sequencePhase, setSequencePhase] = useState<SecurityPhase>("arriving");
  const phase = reducedMotion ? "gate" : sequencePhase;
  const ticketImage = `${import.meta.env.BASE_URL}ticket.jpg`;
  const isTorn = phase !== "arriving";
  const isGate = phase === "gate";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (
      !returnFocusRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      returnFocusRef.current = document.activeElement;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (dialog && !dialog.open) dialog.showModal();

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      const previousFocus = returnFocusRef.current;
      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      } else {
        document
          .querySelector<HTMLElement>(".success-content h2")
          ?.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const tearTimer = window.setTimeout(() => setSequencePhase("torn"), 1050);
    const gateTimer = window.setTimeout(() => setSequencePhase("gate"), 2050);
    return () => {
      window.clearTimeout(tearTimer);
      window.clearTimeout(gateTimer);
    };
  }, [reducedMotion]);

  return (
    <dialog
      ref={dialogRef}
      className="security-dialog"
      data-phase={phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-labelledby="security-title"
      aria-describedby="security-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className="security-dialog-content"
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <header className="security-dialog-header">
          <div>
            <span className="security-eyebrow">
              <ShieldCheck aria-hidden="true" /> SECURITY CHECK
            </span>
            <h2 id="security-title">Проверка завершена.</h2>
          </div>
          <button
            className="security-close"
            onClick={onClose}
            aria-label="Закрыть проверку безопасности"
            autoFocus
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="security-stage">
          <div className="security-light-sweep security-light-sweep--red" />
          <div className="security-light-sweep security-light-sweep--blue" />
          <div className="security-stage-grid" />
          <div className="security-stage-topline" aria-hidden="true">
            <span>AVA · TERMINAL SECURITY</span>
            <span className="security-clearance">
              <Check /> CLEARED
            </span>
          </div>

          <SecuritySirens />

          <div className="security-ticket-position">
            <motion.div
              className="security-ticket-camera"
              initial={
                reducedMotion ? false : { opacity: 0, scale: 0.82, y: 28 }
              }
              animate={{
                opacity: 1,
                scale: isGate && !reducedMotion ? 7.2 : 1,
                y: 0,
              }}
              transition={{
                duration: isGate ? 1.25 : 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-label={`Билет AVA разорван пополам. GATE ${FLIGHT.gate}.`}
              role="img"
            >
              <motion.div
                className="security-ticket-half security-ticket-half--left"
                style={{ clipPath: LEFT_TEAR }}
                initial={false}
                animate={{ x: isTorn ? "-3%" : "0%", rotate: isTorn ? -2 : 0 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.75,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div
                  className="security-ticket-surface"
                  style={{ backgroundImage: `url(${ticketImage})` }}
                >
                  <span className="security-gate-label" aria-hidden="true">
                    GATE
                  </span>
                  <span className="security-gate-code" aria-hidden="true">
                    {FLIGHT.gate}
                  </span>
                </div>
              </motion.div>
              <motion.div
                className="security-ticket-half security-ticket-half--right"
                style={{ clipPath: RIGHT_TEAR }}
                initial={false}
                animate={{
                  x: isTorn ? "5%" : "0%",
                  y: isTorn ? "13%" : "0%",
                  rotate: isTorn ? 5 : 0,
                  opacity: isGate && !reducedMotion ? 0.45 : 1,
                }}
                transition={{
                  duration: reducedMotion ? 0 : 0.85,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div
                  className="security-ticket-surface"
                  style={{ backgroundImage: `url(${ticketImage})` }}
                />
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="security-gate-marker"
            aria-hidden="true"
            initial={false}
            animate={{
              opacity: isGate && !reducedMotion ? 1 : 0,
              scale: isGate ? 1 : 0.85,
            }}
            transition={{ delay: reducedMotion ? 0 : 0.9, duration: 0.3 }}
          >
            <span />
            <span />
            <span />
            <span />
          </motion.div>

          <div
            className="security-stage-caption"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="security-caption-line" />
            <span>
              {isGate
                ? "ВЫХОД НАЙДЕН"
                : isTorn
                  ? "ОТКРЫВАЕМ ВАШ ВЫХОД"
                  : "ПРОВЕРЯЕМ ПОСАДОЧНЫЙ ТАЛОН"}
            </span>
            <strong>{isGate ? `GATE ${FLIGHT.gate}` : "AVA"}</strong>
          </div>
        </div>

        <footer className="security-dialog-footer">
          <p id="security-description">
            <span className="security-verified-dot" />
            <span>
              Регистрация успешна. Ваш выход — <strong>{FLIGHT.gate}</strong>.
            </span>
          </p>
          <motion.button
            className="security-continue"
            onClick={onClose}
            whileHover={reducedMotion ? undefined : { x: 2 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          >
            Продолжить <ArrowUpRight aria-hidden="true" />
          </motion.button>
        </footer>
      </motion.div>
    </dialog>
  );
}
