import type { ReactNode } from "react";

export interface RadarAxis {
  label: string;
  /** 0–100 */
  score: number;
  /** Shown as the hover tooltip for the axis point */
  description: string;
}

interface ReputationRadarProps {
  axes: RadarAxis[];
  size?: number;
}

const RINGS = [25, 50, 75, 100];

function polarPoint(index: number, total: number, radius: number, center: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)];
}

/** Multi-axis reputation chart with a screen-reader table fallback (#402). */
export function ReputationRadar({ axes, size = 240 }: ReputationRadarProps): ReactNode {
  const center = size / 2;
  const maxRadius = size / 2 - 36;
  const total = axes.length;

  const polygon = axes
    .map((axis, i) => {
      const [x, y] = polarPoint(i, total, (Math.max(0, Math.min(100, axis.score)) / 100) * maxRadius, center);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Reputation breakdown radar chart"
        className="max-w-full h-auto"
      >
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={axes
              .map((_, i) => polarPoint(i, total, (ring / 100) * maxRadius, center).join(","))
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            className="text-text-secondary"
          />
        ))}

        {axes.map((axis, i) => {
          const [x, y] = polarPoint(i, total, maxRadius, center);
          const [lx, ly] = polarPoint(i, total, maxRadius + 18, center);
          return (
            <g key={axis.label}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.15} className="text-text-secondary" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-text-secondary text-[10px]"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        <polygon points={polygon} fill="currentColor" fillOpacity={0.2} stroke="currentColor" strokeWidth={2} className="text-gold" />

        {axes.map((axis, i) => {
          const [x, y] = polarPoint(i, total, (Math.max(0, Math.min(100, axis.score)) / 100) * maxRadius, center);
          return (
            <circle key={`${axis.label}-point`} cx={x} cy={y} r={4} className="fill-gold">
              <title>{`${axis.label}: ${axis.score}% (${axis.description})`}</title>
            </circle>
          );
        })}
      </svg>

      <table className="sr-only">
        <caption>Reputation breakdown</caption>
        <thead>
          <tr>
            <th scope="col">Factor</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {axes.map((axis) => (
            <tr key={axis.label}>
              <th scope="row">{axis.label}</th>
              <td>{axis.score}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
