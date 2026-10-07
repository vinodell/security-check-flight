import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Download, Ticket, X } from "lucide-react";
import { ASSETS, DOWNLOAD_JOKE_TEXT } from "../consts";
import "./SecurityCheckDialog.css";
import "./DownloadJokeDialog.css";

type DownloadJokeDialogProps = {
  onClose: () => void;
  onDownload: () => void;
};

export default function DownloadJokeDialog({
  onClose,
  onDownload,
}: DownloadJokeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

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
      if (returnFocusRef.current?.isConnected) {
        returnFocusRef.current.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="security-dialog download-joke-dialog"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-labelledby="download-joke-title"
      aria-describedby="download-joke-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          onClose();
        }
      }}
    >
      <motion.div
        className="download-joke-content"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 260, damping: 24 }
        }
      >
        <header className="download-joke-header">
          <span className="security-eyebrow">
            <Ticket aria-hidden="true" /> AVA · ONE TICKET IS ENOUGH
          </span>
          <button
            type="button"
            className="security-close"
            onClick={onClose}
            aria-label="Закрыть шутку"
            autoFocus
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="download-joke-stage">
          <figure className="download-joke-photo">
            <motion.img
              className="download-joke-image"
              src={`${import.meta.env.BASE_URL}${ASSETS.downloadJoke}`}
              width="768"
              height="500"
              alt="Зачем скачивать билет?"
              initial={
                reducedMotion ? false : { opacity: 0, scale: 1.14, rotate: -2 }
              }
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.75,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            <span className="download-joke-photo-label" aria-hidden="true">
              AVA REACTION CAM · 01
            </span>
            <motion.span
              className="download-joke-question"
              aria-hidden="true"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.4 }}
              animate={
                reducedMotion
                  ? { opacity: 1, scale: 1, rotate: 0 }
                  : {
                      opacity: 1,
                      scale: [0.4, 1.12, 0.94, 1],
                      rotate: [-12, 10, -5, 0],
                    }
              }
              transition={{
                delay: reducedMotion ? 0 : 0.3,
                duration: reducedMotion ? 0 : 0.7,
              }}
            >
              ?
            </motion.span>
          </figure>

          <div className="download-joke-copy">
            <motion.span
              className="download-joke-status"
              initial={reducedMotion ? false : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: reducedMotion ? 0 : 0.15,
                duration: reducedMotion ? 0 : 0.35,
              }}
            >
              ЗАПРОС НА ЕЩЁ ОДИН БИЛЕТ
            </motion.span>
            <motion.h2
              id="download-joke-title"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reducedMotion ? 0 : 0.28,
                duration: reducedMotion ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {DOWNLOAD_JOKE_TEXT}
            </motion.h2>
            <motion.p
              id="download-joke-description"
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reducedMotion ? 0 : 0.45,
                duration: reducedMotion ? 0 : 0.35,
              }}
            >
              Билет уже у тебя. Но второй экземпляр тоже можем выдать.
            </motion.p>
          </div>
        </div>

        <footer className="download-joke-footer">
          <motion.button
            type="button"
            className="download-joke-download"
            onClick={onDownload}
            whileHover={reducedMotion ? undefined : { y: -2 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          >
            <Download aria-hidden="true" /> Всё равно скачать
          </motion.button>
          <motion.button
            type="button"
            className="security-continue download-joke-understood"
            onClick={onClose}
            whileHover={reducedMotion ? undefined : { x: 2 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          >
            Ладно, понял <ArrowUpRight aria-hidden="true" />
          </motion.button>
        </footer>
      </motion.div>
    </dialog>
  );
}
