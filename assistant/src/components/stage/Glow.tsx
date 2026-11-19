export function Glow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at 100% 0%, #127BB0 0%, rgba(18,123,176,0.55) 30%, rgba(26,26,26,0) 65%)',
      }}
    />
  );
}
