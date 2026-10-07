function Siren({ color }: { color: "red" | "blue" }) {
  return (
    <div className={`security-siren security-siren--${color}`}>
      <div className="security-siren-aura" />
      <div className="security-siren-dome">
        <span className="security-siren-reflector" />
        <span className="security-siren-shine" />
      </div>
      <div className="security-siren-base" />
    </div>
  );
}

export default function SecuritySirens() {
  return (
    <div className="security-sirens" aria-hidden="true">
      <Siren color="red" />
      <span className="security-sirens-label">SECURITY</span>
      <Siren color="blue" />
    </div>
  );
}
