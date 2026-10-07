import { ASSETS } from "../consts";

export default function PrayingFigure() {
  return (
    <img
      className="praying-figure"
      src={`${import.meta.env.BASE_URL}${ASSETS.prayingFigure}`}
      alt="Молящийся человек за глобусом"
      width={807}
      height={362}
      decoding="async"
    />
  );
}
