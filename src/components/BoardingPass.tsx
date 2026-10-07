import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Download, Plane, RotateCcw, ShieldCheck } from "lucide-react";
import { ASSETS, BAR_WIDTHS, EXPECTED_BOOKING, FLIGHT } from "../consts";
import { formatDate } from "../domain/formatDate";
import DownloadJokeDialog from "./DownloadJokeDialog";

function downloadPass() {
  const link = document.createElement("a");
  link.href = `${import.meta.env.BASE_URL}${ASSETS.ticketDownload}`;
  link.download = ASSETS.ticketDownload;
  document.body.append(link);
  link.click();
  link.remove();
}

export default function BoardingPass({
  onRestart,
  onSecurityReplay,
}: {
  onRestart: () => void;
  onSecurityReplay: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const passRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [jokeOpen, setJokeOpen] = useState(false);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  function tilt(event: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType === "touch" || !passRef.current)
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    passRef.current.style.setProperty(
      "--tilt-x",
      `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 8}deg`,
    );
    passRef.current.style.setProperty(
      "--tilt-y",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`,
    );
  }

  return (
    <motion.div
      className="success-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="success-mark">
        <Check size={26} strokeWidth={2.5} />
      </div>
      <div className="eyebrow">РЕГИСТРАЦИЯ ЗАВЕРШЕНА</div>
      <h2 tabIndex={-1} ref={headingRef}>
        Вы на борту.
      </h2>
      <p className="section-description">
        Всё совпало. Ваше место у окна уже ждёт.
        <br />
        Осталось только взять курс на небо.
      </p>
      <div
        className="boarding-perspective"
        onPointerMove={tilt}
        onPointerLeave={() => {
          passRef.current?.style.setProperty("--tilt-x", "0deg");
          passRef.current?.style.setProperty("--tilt-y", "0deg");
        }}
      >
        <div className="boarding-pass" ref={passRef}>
          <div className="boarding-header">
            <span className="boarding-brand">
              AVA
              <small className="brand-motto">{FLIGHT.motto}</small>
            </span>
            <span>
              BOARDING PASS <Plane size={15} />
            </span>
          </div>
          <div className="boarding-main">
            <div className="boarding-route">
              <div>
                <strong>{FLIGHT.originCode}</strong>
                <span>{FLIGHT.originCity}</span>
              </div>
              <Plane size={24} />
              <div>
                <strong>{FLIGHT.destinationCode}</strong>
                <span>{FLIGHT.destinationCity}</span>
              </div>
            </div>
            <p className="boarding-name">
              {EXPECTED_BOOKING.lastName} {EXPECTED_BOOKING.firstName}{" "}
              {EXPECTED_BOOKING.middleName}
            </p>
            <dl className="boarding-details">
              <div>
                <dt>Рейс</dt>
                <dd>{EXPECTED_BOOKING.flightNumber}</dd>
              </div>
              <div>
                <dt>Дата</dt>
                <dd>{formatDate(EXPECTED_BOOKING.departureDate)}</dd>
              </div>
              <div>
                <dt>Посадка</dt>
                <dd>{FLIGHT.boardingTime}</dd>
              </div>
            </dl>
          </div>
          <div className="boarding-tear">
            <span /> <span />
          </div>
          <div className="boarding-stub">
            <div>
              <span>ВЫХОД</span>
              <strong>{FLIGHT.gate}</strong>
            </div>
            <div>
              <span>МЕСТО</span>
              <strong>{FLIGHT.seat}</strong>
            </div>
            <div className="barcode" aria-hidden="true">
              {BAR_WIDTHS.map((width, index) => (
                <i key={index} style={{ width: `${width}px` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <motion.button
        className="primary-button"
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        onClick={() => setJokeOpen(true)}
      >
        <span>
          {downloaded ? "Скачать ещё раз" : "Скачать посадочный талон"}
        </span>
        <Download size={18} />
      </motion.button>
      {downloaded && (
        <p className="download-status" role="status">
          Талон сохранён в формате JPG
        </p>
      )}
      <div className="success-actions">
        <button className="text-button restart-button" onClick={onRestart}>
          <RotateCcw size={14} />
          Пройти ещё раз
        </button>
        <button
          className="text-button restart-button"
          onClick={onSecurityReplay}
        >
          <ShieldCheck size={14} />
          Повторить security check
        </button>
      </div>
      {jokeOpen && (
        <DownloadJokeDialog
          onClose={() => setJokeOpen(false)}
          onDownload={() => {
            downloadPass();
            setDownloaded(true);
            setJokeOpen(false);
          }}
        />
      )}
    </motion.div>
  );
}
