import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function SecurityRadar({ securityScore, metrics, selectedRadarModels }) {
  const data = [
    {
      subject: "Authentication",
      score: metrics?.authentication ?? securityScore ?? 50,
    },
    {
      subject: "Authorization",
      score: metrics?.authorization ?? securityScore ?? 50,
    },
    {
      subject: "Validation",
      score: metrics?.input_validation ?? securityScore ?? 50,
    },
    {
      subject: "Secrets",
      score: metrics?.secret_management ?? securityScore ?? 50,
    },
    {
      subject: "Logging",
      score: metrics?.logging ?? securityScore ?? 50,
    },
  ];

  const averageScore =
    (
      (metrics?.authentication ?? 0) +
      (metrics?.authorization ?? 0) +
      (metrics?.input_validation ?? 0) +
      (metrics?.secret_management ?? 0) +
      (metrics?.logging ?? 0)
    ) / 5;

  let radarColor = "#DC2626"; // rouge

  if (averageScore >= 80) {
    radarColor = "#16A34A"; // vert
  } else if (averageScore >= 60) {
    radarColor = "#EAB308"; // jaune
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-bold mb-4">
        Security Radar
      </h2>

      <div className="text-sm text-gray-500 mb-4">
        Model:{selectedRadarModels}
      </div>

      <div
        className={`
          inline-block 
          px-3
          py-1
          rounded-lg
          text-white
          font-semibold
          mb-4 
          ${averageScore >= 80
            ? "bg-green-600"
            : averageScore >= 60
              ? "bg-yellow-500"
              : "bg-red-600"
          }
        `}
      >
        Score: {Math.round(averageScore)}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data}>
          <PolarGrid />

          <PolarAngleAxis dataKey="subject" />

          <PolarRadiusAxis domain={[0, 100]} />

          <Radar
            name="Security"
            dataKey="score"
            fill={radarColor}
            fillOpacity={0.4}
            strokeWidth={3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
