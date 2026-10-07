import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, FileText, Plane, X } from "lucide-react";
import { EXPECTED_BOOKING, FLIGHT } from "../domain/checkIn";
import { formatDate } from "../domain/formatDate";

export default function ReceiptDialog({
  onClose,
  onContinue,
}: {
  onClose: () => void;
  onContinue: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

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
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="receipt-dialog"
      aria-labelledby="receipt-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className="receipt-content"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          className="icon-button dialog-close"
          onClick={onClose}
          aria-label="Закрыть квитанцию"
        >
          <X size={20} />
        </button>
        <div className="eyebrow">
          <FileText size={14} /> ВАШ КЛЮЧ К ПОЛЁТУ
        </div>
        <h2 id="receipt-title">
          Один билет.
          <br />
          Одно совпадение.
        </h2>
        <p className="dialog-description">
          Перед вами небольшая игра. Перенесите данные из квитанции в три блока
          регистрации и получите свой посадочный талон.
        </p>
        <div className="receipt-paper">
          <div className="receipt-paper-header">
            <div className="receipt-brand-lockup">
              <span className="receipt-brand">{FLIGHT.airline}</span>
              <small className="brand-motto">{FLIGHT.motto}</small>
            </div>
            <span>
              МАРШРУТНАЯ
              <br />
              КВИТАНЦИЯ
            </span>
          </div>
          <div className="receipt-route">
            <strong>{FLIGHT.originCode}</strong>
            <span className="receipt-route-line">
              <Plane size={19} />
            </span>
            <strong>{FLIGHT.destinationCode}</strong>
          </div>
          <dl className="receipt-data">
            <div className="receipt-data-full">
              <dt>Пассажир</dt>
              <dd>
                {EXPECTED_BOOKING.lastName} {EXPECTED_BOOKING.firstName}{" "}
                {EXPECTED_BOOKING.middleName}
              </dd>
            </div>
            <div>
              <dt>Дата рождения</dt>
              <dd>{formatDate(EXPECTED_BOOKING.birthDate)}</dd>
            </div>
            <div>
              <dt>Последние 4 цифры паспорта</dt>
              <dd>{EXPECTED_BOOKING.passportLastFour}</dd>
            </div>
            <div>
              <dt>Номер рейса</dt>
              <dd>{EXPECTED_BOOKING.flightNumber}</dd>
            </div>
            <div>
              <dt>Код брони</dt>
              <dd>{EXPECTED_BOOKING.bookingCode}</dd>
            </div>
            <div>
              <dt>Дата вылета</dt>
              <dd>{formatDate(EXPECTED_BOOKING.departureDate)}</dd>
            </div>
            <div>
              <dt>Вылет · прибытие</dt>
              <dd>
                {FLIGHT.departureTime} · {FLIGHT.arrivalTime}
              </dd>
            </div>
          </dl>
          <div className="receipt-paper-footer">
            <span>Сохраните эти данные для игры</span>
            <span>01 / 01</span>
          </div>
        </div>
        <button className="primary-button" onClick={onContinue}>
          К регистрации <ArrowUpRight size={20} />
        </button>
      </motion.div>
    </dialog>
  );
}
