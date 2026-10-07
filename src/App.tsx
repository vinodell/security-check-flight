import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Globe2,
  Info,
  LockKeyhole,
  Plane,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
} from "lucide-react";
import {
  EXPECTED_BOOKING,
  FLIGHT,
  GLOBE_ROUTE,
  INITIAL_CHECK_IN_DATA,
  matchesBooking,
  STEP_FIELDS,
  validateStep,
} from "./domain/checkIn";
import type { CheckInData, CheckInErrors, CheckInStep } from "./domain/checkIn";
import { formatShortDate } from "./domain/formatDate";
import FormField from "./components/FormField";
import ReceiptDialog from "./components/ReceiptDialog";
import BoardingPass from "./components/BoardingPass";
import PrayingFigure from "./components/PrayingFigure";
import SecurityCheckDialog from "./components/SecurityCheckDialog";
import DesktopRequiredDialog from "./components/DesktopRequiredDialog";
import { useIsPhone } from "./hooks/useIsPhone";

const GlobeScene = lazy(() => import("./components/GlobeScene"));

const STEPS: {
  id: CheckInStep;
  label: string;
  title: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    id: "passenger",
    label: "Пассажир",
    title: "Давайте знакомиться.",
    description: "Введите данные пассажира, как в маршрутной квитанции.",
    icon: UserRound,
  },
  {
    id: "flight",
    label: "Рейс",
    title: "Найдём ваш рейс.",
    description: "Номер рейса и код брони — ваш ключ к путешествию.",
    icon: Plane,
  },
  {
    id: "document",
    label: "Документ",
    title: "Последняя проверка.",
    description: "Подтвердите документ. До посадочного талона — один шаг.",
    icon: ShieldCheck,
  },
];

function App() {
  const reducedMotion = useReducedMotion();
  const isPhone = useIsPhone();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<CheckInData>({ ...INITIAL_CHECK_IN_DATA });
  const [errors, setErrors] = useState<CheckInErrors>({});
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loadGlobe, setLoadGlobe] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const previousStep = useRef(0);
  const step = STEPS[stepIndex] ?? STEPS[0]!;
  const StepIcon = step.icon;

  useEffect(() => {
    if (isPhone) return;
    const timer = window.setTimeout(() => setLoadGlobe(true), 200);
    return () => window.clearTimeout(timer);
  }, [isPhone]);

  function changeField(name: keyof CheckInData, value: string) {
    setData((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function goToStep(index: number) {
    setStepIndex(index);
    setErrors({});
    setAttempts(0);
  }

  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPhone) return;
    const nextErrors = validateStep(step.id, data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setAttempts((value) => value + 1);
      const firstInvalid = STEP_FIELDS[step.id].find(
        (field) => nextErrors[field],
      );
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      goToStep(stepIndex + 1);
    } else if (matchesBooking(data)) {
      setRegistered(true);
      setSecurityOpen(true);
    } else {
      const invalidIndex = STEPS.findIndex(
        (item) => Object.keys(validateStep(item.id, data)).length > 0,
      );
      goToStep(Math.max(0, invalidIndex));
    }
  }

  function restart() {
    setSecurityOpen(false);
    setData({ ...INITIAL_CHECK_IN_DATA });
    setRegistered(false);
    goToStep(0);
  }

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="page-shell" inert={isPhone}>
        <motion.header
          className="site-header"
          initial={reducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <a
            href="#"
            className="brand"
            aria-label={`${FLIGHT.airline} — главная`}
            onClick={(event) => event.preventDefault()}
          >
            <span className="brand-symbol">
              <Plane size={20} strokeWidth={2.5} />
            </span>
            AVA <span className="brand-name">SECURITY CHECK</span>
          </a>
          <nav aria-label="Основная навигация">
            <a className="nav-active" href="#check-in">
              Регистрация <span />
            </a>
            <a href="#flight-details">О рейсе</a>
            <button onClick={() => setReceiptOpen(true)}>
              Как играть <ArrowUpRight size={14} />
            </button>
          </nav>
          <span className="header-world">
            <Globe2 size={15} /> RU <span className="header-divider" />{" "}
            {FLIGHT.motto}
          </span>
        </motion.header>

        <main>
          <div className="page-topline">
            <span>ONLINE CHECK-IN</span>
            <span>
              <span className="status-dot" /> РЕГИСТРАЦИЯ ОТКРЫТА
            </span>
          </div>
          <div className="main-grid">
            <section className="hero" aria-labelledby="hero-title">
              <motion.div
                className="hero-copy"
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="hero-eyebrow">
                  <span className="eyebrow-line" /> МЕНЬШЕ ОЖИДАНИЯ. БОЛЬШЕ
                  НЕБА.
                </div>
                <h1 id="hero-title">
                  Ваш рейс
                  <br />
                  начинается
                  <br />
                  <span>здесь.</span>
                  <span className="heading-arrow">
                    <ArrowUpRight strokeWidth={1.4} />
                  </span>
                </h1>
                <p className="hero-description">
                  Найдите свою бронь, пройдите регистрацию
                  <br className="desktop-break" /> и получите место у окна.
                </p>
                <motion.button
                  className="receipt-link"
                  onClick={() => setReceiptOpen(true)}
                  whileHover={reducedMotion ? undefined : { x: 3 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                >
                  <span className="receipt-link-icon">
                    <Ticket size={19} />
                  </span>
                  <span>
                    Маршрутная квитанция<small>Все подсказки уже внутри</small>
                  </span>
                  <ArrowUpRight size={19} />
                </motion.button>
              </motion.div>

              <div
                className="globe-stage"
                role="group"
                aria-label={`Декоративный маршрут ${GLOBE_ROUTE.originCode} — ${GLOBE_ROUTE.destinationCode}: ${GLOBE_ROUTE.originCity} — ${GLOBE_ROUTE.destinationCity}`}
              >
                <div className="globe-orbit orbit-one" />
                <div className="globe-orbit orbit-two" />
                <PrayingFigure />
                <div className="globe-caption">
                  <span className="status-dot" /> МИР БЛИЖЕ, ЧЕМ КАЖЕТСЯ
                </div>
                <div className="globe-canvas">
                  {loadGlobe && !isPhone ? (
                    <Suspense
                      fallback={
                        <div className="globe-placeholder" aria-hidden="true" />
                      }
                    >
                      <GlobeScene reducedMotion={Boolean(reducedMotion)} />
                    </Suspense>
                  ) : (
                    <div className="globe-placeholder" aria-hidden="true" />
                  )}
                </div>
                <motion.div
                  className="globe-origin"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.6 }}
                >
                  <span className="map-pin" />
                  <strong>{GLOBE_ROUTE.originCode}</strong>
                  <span>{GLOBE_ROUTE.originCity}</span>
                </motion.div>
                <motion.div
                  className="globe-destination"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.9 }}
                >
                  <span className="map-pin" />
                  <strong>{GLOBE_ROUTE.destinationCode}</strong>
                  <span>{GLOBE_ROUTE.destinationCity}</span>
                </motion.div>
                <div className="globe-coordinate">59°48′ N &nbsp; 30°16′ E</div>
                <div className="globe-interaction">
                  <span>ДВИГАЙТЕ КУРСОРОМ — МЕНЯЙТЕ РАКУРС</span>
                  <ArrowLeft size={12} />
                  <ArrowRight size={12} />
                </div>
              </div>
            </section>

            <motion.section
              className={`check-in-card ${registered ? "check-in-card--success" : ""}`}
              id="check-in"
              aria-label="Регистрация на рейс"
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : 0.15, duration: 0.55 }}
            >
              {!reducedMotion && !registered && (
                <motion.div
                  key={`scan-${stepIndex}`}
                  className="check-in-scan"
                  aria-hidden="true"
                  initial={{ y: "-100%", opacity: 0 }}
                  animate={{ y: "100%", opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1.25, delay: 0.3 }}
                />
              )}
              <div className="card-topline">
                <span>
                  <span className="card-top-dot" /> AVA SECURITY CHECK
                </span>
                <span>
                  {registered ? "ГОТОВО К ПОЛЁТУ" : "ВАШЕ МЕСТО ЖДЁТ"}
                </span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {registered ? (
                  <BoardingPass
                    key="boarding-pass"
                    onRestart={restart}
                    onSecurityReplay={() => setSecurityOpen(true)}
                  />
                ) : (
                  <motion.div
                    key="registration"
                    className="registration-content"
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <ol className="step-list" aria-label="Этапы регистрации">
                      {STEPS.map((item, index) => (
                        <li
                          key={item.id}
                          className={
                            index === stepIndex
                              ? "step-current"
                              : index < stepIndex
                                ? "step-completed"
                                : ""
                          }
                        >
                          <motion.button
                            type="button"
                            disabled={index > stepIndex}
                            onClick={() => goToStep(index)}
                            aria-current={
                              index === stepIndex ? "step" : undefined
                            }
                            whileTap={
                              reducedMotion ? undefined : { scale: 0.95 }
                            }
                          >
                            <span className="step-number">
                              {index < stepIndex ? (
                                <Check size={14} />
                              ) : (
                                `0${index + 1}`
                              )}
                            </span>
                            <span>{item.label}</span>
                          </motion.button>
                        </li>
                      ))}
                    </ol>
                    <form noValidate onSubmit={submit} ref={formRef}>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={step.id}
                          className="step-content"
                          initial={
                            reducedMotion ? false : { opacity: 0, x: 12 }
                          }
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          onAnimationComplete={() => {
                            if (previousStep.current !== stepIndex) {
                              formRef.current
                                ?.querySelector<HTMLHeadingElement>("h2")
                                ?.focus({ preventScroll: true });
                              previousStep.current = stepIndex;
                            }
                          }}
                        >
                          <div className="section-icon">
                            <StepIcon size={23} strokeWidth={1.6} />
                            <span>0{stepIndex + 1} / 03</span>
                          </div>
                          <h2 tabIndex={-1} className="step-heading">
                            {step.title}
                          </h2>
                          <p className="section-description">
                            {step.description}
                          </p>
                          <div
                            className={`form-fields form-fields--${step.id}`}
                          >
                            {step.id === "passenger" && (
                              <>
                                <div className="field-row">
                                  <FormField
                                    name="lastName"
                                    label="Фамилия"
                                    placeholder={`Например, ${EXPECTED_BOOKING.lastName}`}
                                    autoComplete="family-name"
                                    value={data.lastName}
                                    onChange={changeField}
                                    error={errors.lastName}
                                    maxLength={60}
                                  />
                                  <FormField
                                    name="firstName"
                                    label="Имя"
                                    placeholder={`Например, ${EXPECTED_BOOKING.firstName}`}
                                    autoComplete="given-name"
                                    value={data.firstName}
                                    onChange={changeField}
                                    error={errors.firstName}
                                    maxLength={60}
                                  />
                                </div>
                                <FormField
                                  name="middleName"
                                  label="Отчество"
                                  placeholder="Как в документе"
                                  autoComplete="additional-name"
                                  value={data.middleName}
                                  onChange={changeField}
                                  error={errors.middleName}
                                  maxLength={60}
                                />
                                <FormField
                                  name="birthDate"
                                  label="Дата рождения"
                                  type="date"
                                  autoComplete="bday"
                                  value={data.birthDate}
                                  onChange={changeField}
                                  error={errors.birthDate}
                                />
                              </>
                            )}
                            {step.id === "flight" && (
                              <>
                                <div className="field-row">
                                  <FormField
                                    name="flightNumber"
                                    label="Номер рейса"
                                    placeholder={EXPECTED_BOOKING.flightNumber}
                                    autoComplete="off"
                                    value={data.flightNumber}
                                    onChange={changeField}
                                    error={errors.flightNumber}
                                    maxLength={16}
                                  />
                                  <FormField
                                    name="bookingCode"
                                    label="Код брони"
                                    placeholder="6 символов"
                                    autoComplete="off"
                                    value={data.bookingCode}
                                    onChange={changeField}
                                    error={errors.bookingCode}
                                    maxLength={12}
                                  />
                                </div>
                                <FormField
                                  name="departureDate"
                                  label="Дата вылета"
                                  type="date"
                                  value={data.departureDate}
                                  onChange={changeField}
                                  error={errors.departureDate}
                                  hint="Дата указана в вашей маршрутной квитанции"
                                />
                                <div className="flight-mini-route">
                                  <div>
                                    <span>ОТКУДА</span>
                                    <strong>{FLIGHT.originCode}</strong>
                                    <small>{FLIGHT.originCity}</small>
                                  </div>
                                  <Plane size={22} />
                                  <div>
                                    <span>КУДА</span>
                                    <strong>{FLIGHT.destinationCode}</strong>
                                    <small>{FLIGHT.destinationCity}</small>
                                  </div>
                                </div>
                              </>
                            )}
                            {step.id === "document" && (
                              <>
                                <FormField
                                  name="passportLastFour"
                                  label="Последние 4 цифры паспорта"
                                  placeholder="0000"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  maxLength={4}
                                  value={data.passportLastFour}
                                  onChange={changeField}
                                  error={errors.passportLastFour}
                                  hint="Для игры нужен только фрагмент номера из квитанции"
                                />
                                <div className="passenger-summary">
                                  <div className="summary-icon">
                                    <UserRound size={22} />
                                  </div>
                                  <div>
                                    <span>ПАССАЖИР</span>
                                    <strong>
                                      {data.lastName} {data.firstName}
                                    </strong>
                                    <small>
                                      {EXPECTED_BOOKING.flightNumber} ·{" "}
                                      {FLIGHT.originCode} →{" "}
                                      {FLIGHT.destinationCode}
                                    </small>
                                  </div>
                                  <Check size={18} />
                                </div>
                                <div className="document-note">
                                  <ShieldCheck size={19} />
                                  <p>
                                    Проверим совпадение с бронью и выпустим ваш
                                    игровой посадочный талон.
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                      <div className="form-feedback" aria-live="polite">
                        {attempts > 0 && Object.keys(errors).length > 0 && (
                          <span>
                            <Info size={14} /> Проверьте поля. Подсказка — в
                            квитанции.
                          </span>
                        )}
                      </div>
                      <motion.button
                        className="primary-button"
                        type="submit"
                        whileHover={reducedMotion ? undefined : { y: -2 }}
                        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
                      >
                        <span>
                          {stepIndex === 2
                            ? "Получить посадочный талон"
                            : "Продолжить"}
                        </span>
                        <ArrowRight size={20} />
                      </motion.button>
                      <div className="form-bottom-row">
                        {stepIndex > 0 ? (
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => goToStep(stepIndex - 1)}
                          >
                            <ArrowLeft size={14} />
                            Назад
                          </button>
                        ) : (
                          <span>
                            <LockKeyhole size={13} /> Данные остаются в браузере
                          </span>
                        )}
                        <span>ШАГ 0{stepIndex + 1} ИЗ 03</span>
                      </div>
                    </form>
                    <div className="game-helper">
                      <span className="helper-icon">
                        <Sparkles size={19} strokeWidth={1.6} />
                      </span>
                      <div>
                        <strong>Это игра. Но ощущения настоящие.</strong>
                        <p>Для регистрации подойдёт только одна бронь.</p>
                        <button onClick={() => setReceiptOpen(true)}>
                          Открыть квитанцию <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>

          <motion.section
            className="flight-strip"
            id="flight-details"
            aria-label="Информация о рейсе"
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.35, duration: 0.5 }}
          >
            <div className="strip-label">
              <span className="strip-icon">
                <Plane size={23} strokeWidth={1.6} />
              </span>
              <div>
                <span>ВАШ СЛЕДУЮЩИЙ ПОЛЁТ</span>
                <strong>{EXPECTED_BOOKING.flightNumber}</strong>
              </div>
            </div>
            <div className="strip-route">
              <div>
                <strong>{FLIGHT.originCode}</strong>
                <span>{FLIGHT.originCity}</span>
              </div>
              <div className="strip-route-line">
                <span />
                <Plane size={18} />
                <span />
              </div>
              <div>
                <strong className="strip-future">
                  {FLIGHT.displayDestination}
                </strong>
                <span>ВАШ НОВЫЙ ГОРИЗОНТ</span>
              </div>
            </div>
            <div className="strip-detail">
              <span>ВЫЛЕТ</span>
              <strong>
                {FLIGHT.departureTime}
                <small>{formatShortDate(EXPECTED_BOOKING.departureDate)}</small>
              </strong>
            </div>
            <div className="strip-detail">
              <span>В ПУТИ</span>
              <strong>{FLIGHT.duration}</strong>
            </div>
            <div className="strip-detail strip-status">
              <span>СТАТУС</span>
              <strong>
                <span className="status-dot" /> По расписанию
              </strong>
            </div>
          </motion.section>
        </main>

        <footer className="site-footer">
          <span>© 2026 AVA</span>
          <span className="footer-motto">{FLIGHT.motto}</span>
          <a href="#check-in">
            К регистрации <ArrowDown size={13} />
          </a>
        </footer>
        {receiptOpen && !isPhone && (
          <ReceiptDialog
            onClose={() => setReceiptOpen(false)}
            onContinue={() => {
              setReceiptOpen(false);
              window.requestAnimationFrame(() =>
                document
                  .getElementById(STEP_FIELDS[step.id][0])
                  ?.focus({ preventScroll: true }),
              );
            }}
          />
        )}
        {securityOpen && !isPhone && (
          <SecurityCheckDialog onClose={() => setSecurityOpen(false)} />
        )}
      </div>
      {isPhone && <DesktopRequiredDialog />}
    </MotionConfig>
  );
}

export default App;
