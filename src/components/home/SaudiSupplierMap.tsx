/** Stylized dotted Saudi Arabia map for homepage — decorative, not a live GIS map. */
export function SaudiSupplierMap({ activeCity = "Riyadh" }: { activeCity?: string }) {
  const cities = [
    { id: "Tabuk", x: 78, y: 72 },
    { id: "Madinah", x: 118, y: 128 },
    { id: "Jeddah", x: 98, y: 188 },
    { id: "Makkah", x: 118, y: 205 },
    { id: "Riyadh", x: 210, y: 195 },
    { id: "Qassim", x: 175, y: 135 },
    { id: "Dammam", x: 295, y: 155 },
    { id: "Abha", x: 145, y: 295 },
    { id: "Jazan", x: 128, y: 340 },
    { id: "Najran", x: 185, y: 330 },
  ];

  return (
    <svg
      className="hukum-sa-map"
      viewBox="0 0 360 400"
      role="img"
      aria-label="Saudi Arabia supplier map"
    >
      <defs>
        <pattern id="hukum-dot-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="1.1" fill="#C5CEC8" />
        </pattern>
        <clipPath id="hukum-sa-shape">
          <path d="M72 48 C110 36 150 42 188 58 C230 78 268 92 308 108 C330 122 338 150 332 178 C324 220 308 255 278 290 C250 324 210 350 168 360 C130 368 100 350 88 318 C74 278 64 240 58 198 C52 158 54 112 72 48 Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#hukum-sa-shape)">
        <rect x="40" y="30" width="310" height="350" fill="url(#hukum-dot-grid)" />
      </g>

      <path
        d="M72 48 C110 36 150 42 188 58 C230 78 268 92 308 108 C330 122 338 150 332 178 C324 220 308 255 278 290 C250 324 210 350 168 360 C130 368 100 350 88 318 C74 278 64 240 58 198 C52 158 54 112 72 48 Z"
        fill="none"
        stroke="#9AA89F"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        opacity="0.55"
      />

      {/* Network lines from Riyadh hub */}
      {[
        [210, 195, 98, 188],
        [210, 195, 295, 155],
        [210, 195, 175, 135],
        [210, 195, 145, 295],
        [210, 195, 118, 128],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#17634B"
          strokeWidth="1.25"
          strokeDasharray="4 5"
          opacity="0.35"
        />
      ))}

      {cities.map((c) => {
        const active = c.id.toLowerCase() === activeCity.toLowerCase();
        return (
          <g key={c.id}>
            <circle
              cx={c.x}
              cy={c.y}
              r={active ? 7 : 4.5}
              fill={active ? "#17634B" : "#7D8B83"}
            />
            {active ? (
              <circle cx={c.x} cy={c.y} r="12" fill="none" stroke="#17634B" strokeWidth="1.5" opacity="0.35" />
            ) : null}
            <text
              x={c.x + (c.id === "Dammam" ? -28 : 10)}
              y={c.y + 4}
              className="hukum-sa-map__label"
              fill={active ? "#17634B" : "#6B7870"}
              fontSize="11"
              fontWeight={active ? 700 : 500}
            >
              {c.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
