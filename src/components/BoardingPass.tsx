import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Download, Plane, RotateCcw } from 'lucide-react'
import { EXPECTED_BOOKING, FLIGHT } from '../domain/checkIn'
import { formatDate } from '../domain/formatDate'

const BAR_WIDTHS = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4]

function downloadPass() {
  let x = 36
  const bars = BAR_WIDTHS.map((width) => {
    const rect = `<rect x="${x}" y="330" width="${width * 2}" height="42"/>`
    x += width * 2 + 3
    return rect
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440"><rect width="640" height="440" rx="24" fill="#f6f8f3"/><rect width="640" height="88" rx="24" fill="#244de8"/><path d="M0 64h640v24H0z" fill="#244de8"/><g font-family="Arial,sans-serif"><text x="36" y="56" font-size="36" font-weight="700" fill="white">aero®</text><text x="390" y="52" font-size="14" fill="white">ПОСАДОЧНЫЙ ТАЛОН</text><g fill="#18302f"><text x="36" y="156" font-size="44" font-weight="700">${FLIGHT.originCode} → ${FLIGHT.destinationCode}</text><text x="36" y="192" font-size="19">${EXPECTED_BOOKING.lastName} ${EXPECTED_BOOKING.firstName} ${EXPECTED_BOOKING.middleName}</text><text x="36" y="240" font-size="15">РЕЙС ${EXPECTED_BOOKING.flightNumber} · ${formatDate(EXPECTED_BOOKING.departureDate)}</text><text x="36" y="285" font-size="19">ВЫХОД ${FLIGHT.gate}    МЕСТО ${FLIGHT.seat}    ПОСАДКА ${FLIGHT.boardingTime}</text>${bars}<text x="36" y="405" font-size="12">Игровой посадочный талон · Бронь ${EXPECTED_BOOKING.bookingCode}</text></g></g></svg>`
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `Aero-${EXPECTED_BOOKING.bookingCode}.svg`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function BoardingPass({ onRestart }: { onRestart: () => void }) {
  const reducedMotion = useReducedMotion()
  const passRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  function tilt(event: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType === 'touch' || !passRef.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    passRef.current.style.setProperty('--tilt-x', `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 8}deg`)
    passRef.current.style.setProperty('--tilt-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`)
  }

  return (
    <motion.div className="success-content" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="success-mark"><Check size={26} strokeWidth={2.5} /></div>
      <div className="eyebrow">РЕГИСТРАЦИЯ ЗАВЕРШЕНА</div>
      <h2 tabIndex={-1} ref={headingRef}>Вы на борту.</h2>
      <p className="section-description">Всё совпало. Ваше место у окна уже ждёт.<br />Осталось только взять курс на небо.</p>
      <div className="boarding-perspective" onPointerMove={tilt} onPointerLeave={() => {
        passRef.current?.style.setProperty('--tilt-x', '0deg')
        passRef.current?.style.setProperty('--tilt-y', '0deg')
      }}>
        <div className="boarding-pass" ref={passRef}>
          <div className="boarding-header"><span>aero<span>®</span></span><span>BOARDING PASS <Plane size={15} /></span></div>
          <div className="boarding-main">
            <div className="boarding-route"><div><strong>{FLIGHT.originCode}</strong><span>{FLIGHT.originCity}</span></div><Plane size={24} /><div><strong>{FLIGHT.destinationCode}</strong><span>{FLIGHT.destinationCity}</span></div></div>
            <p className="boarding-name">{EXPECTED_BOOKING.lastName} {EXPECTED_BOOKING.firstName} {EXPECTED_BOOKING.middleName}</p>
            <dl className="boarding-details"><div><dt>Рейс</dt><dd>{EXPECTED_BOOKING.flightNumber}</dd></div><div><dt>Дата</dt><dd>{formatDate(EXPECTED_BOOKING.departureDate)}</dd></div><div><dt>Посадка</dt><dd>{FLIGHT.boardingTime}</dd></div></dl>
          </div>
          <div className="boarding-tear"><span /> <span /></div>
          <div className="boarding-stub"><div><span>ВЫХОД</span><strong>{FLIGHT.gate}</strong></div><div><span>МЕСТО</span><strong>{FLIGHT.seat}</strong></div><div className="barcode" aria-hidden="true">{BAR_WIDTHS.map((width, index) => <i key={index} style={{ width: `${width}px` }} />)}</div></div>
        </div>
      </div>
      <button className="primary-button" onClick={() => { downloadPass(); setDownloaded(true) }}><span>{downloaded ? 'Скачать ещё раз' : 'Скачать посадочный талон'}</span><Download size={18} /></button>
      {downloaded && <p className="download-status" role="status">Талон сохранён в формате SVG</p>}
      <button className="text-button restart-button" onClick={onRestart}><RotateCcw size={14} />Пройти ещё раз</button>
    </motion.div>
  )
}
