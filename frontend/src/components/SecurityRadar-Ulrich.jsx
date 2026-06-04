import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function SecurityRadar({ metrics }) {
  const data = [
    {
      subject: "Authentication",
      score: metrics?.authentication || 0,
    },
    {
      subject: "Authorization",
      score: metrics?.authorization || 0,
    },
    {
      subject: "Validation",
      score: metrics?.input_validation || 0,
    },
    {
      subject: "Secrets",
      score: metrics?.secret_management || 0,
    },
    {
      subject: "Logging",
      score: metrics?.logging || 0,
    },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-4">Security Radar</h2>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />

          <PolarAngleAxis dataKey="subject" />

          <PolarRadiusAxis domain={[0, 100]} />

          <Radar name="Security" dataKey="score" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
