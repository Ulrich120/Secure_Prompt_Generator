export default function AttackCards({ content }) {
  if (!content) return null;

  const attacks = content
    .split("# Attack Scenario")
    .filter((attack) => attack.trim() !== "");

  const getSeverity = (attack) => {
    if (attack.includes("Critical")) return "Critical";
    if (attack.includes("High")) return "High";
    if (attack.includes("Medium")) return "Medium";
    return "Low";
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500";
      case "High":
        return "bg-orange-500";
      case "Medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const parseAttack = (attack) => {
    return {
      exploit:
        attack.match(/Exploit:(.*?)(Impact:|Mitigation:|$)/s)?.[1]?.trim() ||
        "",

      impact: attack.match(/Impact:(.*?)(Mitigation:|$)/s)?.[1]?.trim() || "",

      mitigation: attack.match(/Mitigation:(.*)$/s)?.[1]?.trim() || "",
    };
  };

  const criticalCount = attacks.filter(
    (a) => getSeverity(a) === "Critical",
  ).length;

  const highCount = attacks.filter((a) => getSeverity(a) === "High").length;

  const mediumCount = attacks.filter((a) => getSeverity(a) === "Medium").length;

  const lowCount = attacks.filter((a) => getSeverity(a) === "Low").length;

  return (
    <div className="mt-6">
      {/* DASHBOARD SUMMARY */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-red-100 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500">Critical</div>

          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </div>

        <div className="bg-orange-100 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500">High</div>

          <div className="text-2xl font-bold text-orange-600">{highCount}</div>
        </div>

        <div className="bg-yellow-100 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500">Medium</div>

          <div className="text-2xl font-bold text-yellow-600">
            {mediumCount}
          </div>
        </div>

        <div className="bg-green-100 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500">Low</div>

          <div className="text-2xl font-bold text-green-600">{lowCount}</div>
        </div>
      </div>

      {/* ATTACK CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attacks.map((attack, index) => {
          const severity = getSeverity(attack);
          const parsed = parseAttack(attack);

          return (
            <div
              key={index}
              className="
                                bg-white
                                border
                                rounded-2xl
                                shadow
                                hover:shadow-lg
                                transition
                                p-5
                            "
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Attack #{index + 1}</h3>

                <span
                  className={`
                                        px-3
                                        py-1
                                        rounded-lg
                                        text-white
                                        text-sm
                                        font-bold
                                        ${getSeverityColor(severity)}
                                `}
                >
                  {severity}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-red-600">Exploit</h4>

                  <p className="text-sm text-gray-700">{parsed.exploit}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-orange-600">Impact</h4>

                  <p className="text-sm text-gray-700">{parsed.impact}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-600">Mitigation</h4>

                  <p className="text-sm text-gray-700">{parsed.mitigation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
