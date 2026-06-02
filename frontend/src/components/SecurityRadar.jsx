import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function SecurityRadar({ securityScore, metrics }) {
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

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-bold mb-4">Security Radar</h2>

      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data}>
          <PolarGrid />

          <PolarAngleAxis dataKey="subject" />

          <PolarRadiusAxis domain={[0, 100]} />

          <Radar
            name="Security"
            dataKey="score"
            fill="#3B82F6"
            fillOpacity={0.6}
            stroke="#2563EB"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
