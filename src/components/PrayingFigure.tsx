export default function PrayingFigure() {
  return (
    <img
      className="praying-figure"
      src={`${import.meta.env.BASE_URL}pray_man.jpg`}
      alt="Молящийся человек за глобусом"
      width={807}
      height={362}
      decoding="async"
    />
  )
}
