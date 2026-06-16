import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { exportSecurityReport } from "../utils/pdfExporter";
import { generateRecommendations } from "../utils/recommendationEngine";
import SecurityRadar from "../components/SecurityRadar";
import AttackCards from "../components/AttackCards";
import VulnerabilityChart from "../components/VulnerabilityChart";

import { buildPrompt } from "../utils/promptBuilder";
import { runPromptChain } from "../utils/promptChain";
import MarkdownRenderer from "../components/MarkdownRenderer";

export default function Dashboard() {
    // ROUTER PARAMS
    const { mode } = useParams();

    // STATES
    const [userInput, setUserInput] = useState("");
    const [history, setHistory] = useState([]);
    const [scenarios, setScenarios] = useState([]);
    const [strategies, setStrategies] = useState([]);

    const [selectedScenario, setSelectedScenario] = useState(null);
    const [selectedStrategies, setSelectedStrategies] = useState([]);

    const [loadingScenarios, setLoadingScenarios] = useState(false);

    const [llmResponse, setLlmResponse] = useState("");
    const [selectedModels, setSelectedModels] = useState(["llama3"]);
    const [modelComparisons, setModelComparisons] = useState([]);
    const [selectedRadarModels, setSelectedRadarModels] = useState("llama3");
    const [selectedRadarMetrics, setSelectedRadarMetrics] = useState(null);

    const [loading, setLoading] = useState(false);

    const [securityMetrics, setSecurityMetrics] = useState({
        authentication: 50,
        authorization: 50,
        input_validation: 50,
        secret_management: 50,
        logging: 50,
    });
    const [securityScore, setSecurityScore] = useState(null);
    const [riskLevel, setRiskLevel] = useState("");

    const [chainResults, setChainResults] = useState([]);
    const [executionTime, setExecutionTime] = useState(null);

    // LOAD SCENARIOS
    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                setLoadingScenarios(true);

                const response = await fetch(`http://127.0.0.1:8000/scenarios/${mode}`);

                const data = await response.json();

                setScenarios(data);
            } catch (error) {
                console.error("Erreur lors du chargement des scénarios :", error);
            } finally {
                setLoadingScenarios(false);
            }
        };

        fetchScenarios();
    }, [mode]);

    // LOAD STRATEGIES
    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const response = await fetch(
                    `http://127.0.0.1:8000/strategies/${mode}`,
                );

                const data = await response.json();

                console.log("STRATEGIES LOADED:", data);

                setStrategies(data);
            } catch (error) {
                console.error("Erreur lors du chargement des stratégies :", error);
            }
        };

        fetchStrategies();
    }, [mode]);

    // RESET WHEN MODE CHANGES
    useEffect(() => {
        setSelectedScenario(null);
        setSelectedStrategies([]);

        setUserInput("");

        setLlmResponse("");

        setHistory([]);

        setChainResults([]);

        setSecurityScore(null);

        setRiskLevel("");
    }, [mode]);

    // BUILD PROMPT
    const generatedPrompt = buildPrompt({
        mode,
        scenario: selectedScenario,
        strategies: selectedStrategies,
        userInput,
        history,
    });

    // MODEL TOGGLE
    const toggleModel = (model) => {
        setSelectedModels((prev) => {
            if (prev.includes(model) && prev.length === 1) {
                return prev;
            }

            return prev.includes(model)
                ? prev.filter((m) => m !== model)
                : [...prev, model];
        });
    };

    // MODEL COMPARISON
    const runModelComparison = async (prompt) => {
        const models = selectedModels;

        const results = [];

        for (const model of models) {
            try {
                const start = performance.now();

                const response = await fetch("http://localhost:11434/api/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model,
                        prompt,
                        stream: false,
                    }),
                });

                const data = await response.json();

                const end = performance.now();

                const executionTime = (end - start) / 1000;

                const responseLength = data.response.length;

                const vulnerabilityCount = (
                    data.response.match(/critical|high|medium|low/gi) || []
                ).length;

                let metrics = {
                    authentication: 0,
                    authorization: 0,
                    input_validation: 0,
                    secret_management: 0,
                    logging: 0,
                };

                try {
                    const jsonMatch = data.response.match(/\{[\s\S]*?\}/);

                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);

                        metrics = {
                            authentication: parsed.authentication || 0,
                            authorization: parsed.authorization || 0,
                            input_validation: parsed.input_validation || 0,
                            secret_management: parsed.secret_management || 0,
                            logging: parsed.logging || 0,
                        };
                    }
                } catch (error) {
                    console.error("Metrics parse error:", error);
                }

                const score = Math.round(
                    (metrics.authentication +
                        metrics.authorization +
                        metrics.input_validation +
                        metrics.secret_management +
                        metrics.logging) / 5
                );

                results.push({
                    model,
                    executionTime,
                    responseLength,
                    vulnerabilityCount,
                    score,
                    response: data.response,
                    metrics,
                });
            } catch (error) {
                console.error(error);
            }
        }

        results.sort((a, b) => b.score - a.score);

        setModelComparisons(results);
        if (results.length > 0) {
            setSelectedRadarModels(results[0].model);
            setSelectedRadarMetrics(results[0].metrics);
        }

        console.log("MODEL COMPARISON RESULTS", results);
    };

    // SEND TO LLM
    const sendToLLM = async () => {
        try {
            setLoading(true);

            setLlmResponse("");

            setSecurityScore(null);

            setRiskLevel("");

            const startTime = performance.now();

            const result = await runPromptChain({
                generatedPrompt,
                selectedStrategies,
                selectedModels,
            });

            const endTime = performance.now();
            setExecutionTime(((endTime - startTime) / 1000).toFixed(2));

            setLlmResponse(result.finalResponse);

            setHistory((prev) => [...prev, result.finalResponse]);

            setChainResults(result.steps || result.chainResults || []);

            /* Model Comparison */
            await runModelComparison(generatedPrompt);

            try {
                const scoringStep = result.steps?.find(
                    (step) => step.title === "Security Scoring",
                );

                const source = scoringStep?.content || result.finalResponse;

                const jsonMatch = source.match(/\{[\s\S]*?\}/);

                if (jsonMatch) {
                    const metrics = JSON.parse(jsonMatch[0]);

                    console.log("SECURITY METRICS:", metrics);

                    setSecurityMetrics({
                        authentication: metrics.authentication,

                        authorization: metrics.authorization,

                        input_validation: metrics.input_validation,

                        secret_management: metrics.secret_management,

                        logging: metrics.logging,
                    });

                    setSecurityScore(metrics.overall_score);

                    setRiskLevel(metrics.risk_level);
                }
            } catch (error) {
                console.error("JSON PARSE ERROR:", error);
            }
        } catch (error) {
            console.error(error);

            setLlmResponse("Erreur lors du prompt chaining.");
        } finally {
            setLoading(false);
        }
    };

    /* BEST MODEL */
    const bestModel =
        modelComparisons.length > 0
            ? [...modelComparisons].sort((a, b) => b.score - a.score)[0]
            : null;

    const recommendations = generateRecommendations(securityMetrics);

    const criticalCount =
        JSON.stringify(chainResults).match(/critical/gi)?.length || 0;

    const highCount = JSON.stringify(chainResults).match(/high/gi)?.length || 0;

    const mediumCount =
        JSON.stringify(chainResults).match(/medium/gi)?.length || 0;

    const lowCount = JSON.stringify(chainResults).match(/low/gi)?.length || 0;

    // RENDER
    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* HEADER */}
            <div
                className="
          h-20
          bg-gray-900
          text-white
          flex
          items-center
          px-8
          text-2xl
          font-bold
          shadow-lg
        "
            >
                Secure Prompt Generator
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL */}
                <div
                    className="
            w-[18%]
            bg-slate-600
            border-r
            p-4
            overflow-y-auto
          "
                >
                    <h2 className="text-xl font-bold mb-4 text-white">Scénarios</h2>

                    {/* LOADING */}
                    {loadingScenarios && (
                        <div className="text-white italic">Chargement des scénarios...</div>
                    )}

                    {/* SCENARIOS */}
                    <div className="space-y-2">
                        {scenarios.map((scenario, index) => (
                            <button
                                key={scenario.id || index}
                                onClick={() => setSelectedScenario(scenario)}
                                className={`
                  w-full
                  p-4
                  rounded-xl
                  transition
                  font-semibold
                  text-white

                  ${selectedScenario?.id === scenario.id
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-gray-500 hover:bg-gray-600"
                                    }
                `}
                            >
                                {scenario.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CENTER PANEL */}
                <div
                    className="
            w-[64%]
            flex
            flex-col
            p-4
            gap-4
            overflow-y-auto
          "
                >
                    {/* PROMPT PANEL */}
                    <div
                        className="
              bg-white
              rounded-2xl
              shadow
              p-4
            "
                    >
                        <div
                            className="
                flex
                items-center
                justify-between
                mb-4
              "
                        >
                            <h2 className="text-xl font-bold">Prompt Généré</h2>

                            <div className="flex gap-3">
                                <button
                                    onClick={sendToLLM}
                                    className="
                    px-4
                    py-2
                    bg-blue-500
                    hover:bg-blue-700
                    text-white
                    rounded-lg
                    transition
                  "
                                >
                                    {loading ? "Analyse..." : "Générer Réponse"}
                                </button>

                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedPrompt);
                                    }}
                                    className="
                    px-4
                    py-2
                    bg-green-500
                    hover:bg-green-700
                    text-white
                    rounded-lg
                    transition
                  "
                                >
                                    Copier
                                </button>

                                <button
                                    onClick={() =>
                                        exportSecurityReport({
                                            selectedScenario,
                                            selectedStrategies,
                                            securityScore,
                                            riskLevel,
                                            generatedPrompt,
                                            llmResponse,
                                            chainResults,
                                        })
                                    }
                                    className="
                    px-4
                    py-2
                    bg-purple-500
                    hover:bg-purple-700
                    text-white
                    rounded-lg
                    transition
                  "
                                >
                                    Export PDF
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={generatedPrompt}
                            readOnly
                            className="
                w-full
                h-64
                border
                rounded-xl
                p-4
                resize-none
                overflow-auto
                bg-gray-50
              "
                        />
                    </div>

                    {/* SECURITY RADAR */}
                    <div
                        className="
              bg-white
              rounded-2xl
              shadow
              p-6
              mb-6
            "
                    >
                        <h2 className="text-xl font-bold mb-4">Security Radar</h2>

                        <span
                            className="
                px-3
                py-1
                bg-gray-100
                text-blue-700
                rounded-lg
                text-sm
                font-semibold
              "
                        >
                            {selectedRadarModels}
                        </span>
                    </div>

                    <SecurityRadar
                        securityScore={securityScore}
                        metrics={selectedRadarMetrics || securityMetrics}
                        selectedRadarModels={selectedRadarModels}
                    />

                    <VulnerabilityChart
                        critical={criticalCount}
                        high={highCount}
                        medium={mediumCount}
                        low={lowCount}
                    />

                    {recommendations.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-bold text-lg mb-4">
                                Security Recommendations
                            </h3>

                            {recommendations.map((rec, index) => {
                                const severityStyles = {
                                    Critical: {
                                        bg: "bg-red-50",
                                        border: "border-red-500",
                                        text: "text-red-700",
                                        icon: "🔴",
                                    },

                                    High: {
                                        bg: "bg-orange-50",
                                        border: "border-orange-500",
                                        text: "text-orange-700",
                                        icon: "🟠",
                                    },

                                    Medium: {
                                        bg: "bg-yellow-50",
                                        border: "border-yellow-500",
                                        text: "text-yellow-700",
                                        icon: "🟡",
                                    },

                                    Low: {
                                        bg: "bg-green-50",
                                        border: "border-green-500",
                                        text: "text-green-700",
                                        icon: "🟢",
                                    },
                                };

                                const style =
                                    severityStyles[rec.severity] || severityStyles.Low;

                                return (
                                    <div
                                        key={index}
                                        className={`
                      ${style.bg}
                      border-l-4
                      ${style.border}
                      rounded-xl
                      p-4
                      mb-4
                      shadow-sm
                      hover:shadow-md
                      transition
                    `}
                                    >
                                        <div className="flex items-center mb-2">
                                            <span className="text-xl mr-2">{style.icon}</span>

                                            <h4 className="font-bold text-lg">{rec.title}</h4>
                                        </div>

                                        <div
                                            className={`
                        text-sm
                        font-semibold
                        mb-3
                        ${style.text}
                      `}
                                        >
                                            {rec.severity}
                                        </div>

                                        <p className="text-gray-700">{rec.recommendation}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* RESPONSE PANEL */}
                    <div
                        className="
              bg-white
              rounded-2xl
              shadow
              p-4
            "
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Réponse du LLM</h2>

                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="bg-blue-100 p-3 rounded-xl">
                                    <div className="text-sm text-gray-500">Score</div>

                                    <div className="text-2xl font-bold">
                                        {securityScore ?? "--"}
                                    </div>
                                </div>

                                <div className="bg-red-100 p-3 rounded-xl">
                                    <div className="text-sm text-gray-500">Risk</div>

                                    <div className="text-2xl font-bold">{riskLevel || "--"}</div>
                                </div>

                                <div className="bg-green-100 p-3 rounded-xl">
                                    <div className="text-sm text-gray-500">Strategies</div>

                                    <div className="text-2xl font-bold">
                                        {selectedStrategies.length}
                                    </div>
                                </div>

                                <div className="bg-purple-100 p-3 rounded-xl">
                                    <div className="text-sm text-gray-500">Time</div>

                                    <div className="text-2xl font-bold">
                                        {executionTime ? `${executionTime}s` : "--"}
                                    </div>
                                </div>
                            </div>

                            {securityScore !== null && (
                                <div className="flex items-center gap-4">
                                    {/* SCORE */}
                                    <div
                                        className={`
                      px-4
                      py-2
                      rounded-xl
                      text-white
                      font-bold

                      ${securityScore >= 80
                                                ? "bg-green-500"
                                                : securityScore >= 60
                                                    ? "bg-yellow-500"
                                                    : "bg-red-500"
                                            }
                    `}
                                    >
                                        Score: {securityScore}/100
                                    </div>

                                    {/* RISK */}
                                    <div
                                        className={`
                      px-4
                      py-2
                      rounded-xl
                      text-white
                      font-bold

                      ${riskLevel === "Low"
                                                ? "bg-green-500"
                                                : riskLevel === "Medium"
                                                    ? "bg-yellow-500"
                                                    : "bg-red-500"
                                            }
                    `}
                                    >
                                        {riskLevel} Risk
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RESPONSE BOX */}
                        <div
                            className="
                border
                rounded-xl
                p-4
                bg-gray-50
                max-h-125
                overflow-auto
              "
                        >
                            {/* CURRENT RESPONSE */}
                            <div className="prose max-w-none">
                                <MarkdownRenderer content={llmResponse} />
                            </div>

                            {/* MODEL COMPARISON */}
                            {modelComparisons.length > 0 && (
                                <div
                                    className="
                    bg-white
                    rounded-xl
                    border
                    p-4
                    mb-6
                  "
                                >
                                    {/* BEST MODEL */}
                                    {bestModel && (
                                        <div
                                            className="
                        mb-4
                        p-4
                        bg-green-100
                        rounded-xl
                        border
                      "
                                        >
                                            🏆 Best Model
                                            <span className="font-bold ml-2">{bestModel.model}</span>
                                            <span className="ml-4">Score: {bestModel.score}</span>
                                        </div>
                                    )}

                                    <h3 className="font-bold text-lg mb-4">Model Comparison</h3>

                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b bg-gray-100">
                                                <th className="text-left p-2">Model</th>

                                                <th className="text-left p-2">Time (s)</th>

                                                <th className="text-left p-2">Response Size</th>

                                                <th className="text-left p-2">Vulnerabilities</th>

                                                <th className="text-left p-2">Score</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {modelComparisons.map((result, index) => (
                                                <tr
                                                    key={index}
                                                    className="
                            border-b 
                            cursor-pointer 
                            hover:bg-gray-50
                          "
                                                    onClick={() => {
                                                        setSelectedRadarModels(result.model);
                                                        setSelectedRadarMetrics(result.metrics);
                                                    }}
                                                >
                                                    <td className="p-2">{result.model}</td>

                                                    <td className="p-2">{result.executionTime}</td>

                                                    <td className="p-2">{result.responseLength}</td>

                                                    <td className="p-2">{result.vulnerabilityCount}</td>

                                                    <td className="p-2 font-bold">{result.score}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* PROMPT CHAIN FLOW */}
                            {chainResults.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-bold text-lg mb-4">Prompt Chain Flow</h3>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {chainResults.map((step, index) => (
                                            <div key={index} className="flex items-center">
                                                <div
                                                    className="
                            px-4
                            py-2
                            bg-blue-500
                            text-white
                            rounded-xl
                            font-semibold
                          "
                                                >
                                                    {step.title}
                                                </div>

                                                {index < chainResults.length - 1 && (
                                                    <div className="mx-2 text-2xl">→</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CHAIN RESULTS */}
                            {chainResults.map((step, index) => (
                                <div
                                    key={index}
                                    className="
                    mt-4
                    p-4
                    bg-white
                    border
                    rounded-xl
                    "
                                >
                                    <h3 className="font-bold mb-2">{step.step || step.title}</h3>

                                    {step.executionTime && (
                                        <div className="text-xs text-gray-500 mb-3">
                                            Execution Time: {step.executionTime}s
                                        </div>
                                    )}

                                    <div className="prose max-w-none">
                                        <MarkdownRenderer content={step.content} />
                                    </div>

                                    {step.title === "Attack Simulation" && (
                                        <AttackCards content={step.content} />
                                    )}
                                </div>
                            ))}

                            {/* HISTORY */}
                            {history.length > 0 && (
                                <div className="mt-6 border-t pt-4">
                                    <h3
                                        className="
                      font-bold
                      mb-4
                      text-gray-700
                    "
                                    >
                                        Historique
                                    </h3>

                                    <div className="space-y-4">
                                        {history.map((entry, index) => (
                                            <div
                                                key={index}
                                                className="
                          p-4
                          bg-white
                          rounded-xl
                          shadow-sm
                          border
                        "
                                            >
                                                <div
                                                    className="
                            font-semibold
                            text-sm
                            text-gray-500
                            mb-2
                          "
                                                >
                                                    Response {index + 1}
                                                </div>

                                                <div className="prose max-w-none">
                                                    <MarkdownRenderer content={entry} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {modelComparisons.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="font-bold text-lg mb-4">Model Comparison</h3>

                                    <div className="overflow-x-auto">
                                        <table
                                            className="
                        w-full
                        border
                        rounded-xl
                        overflow-hidden
                      "
                                        >
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="p-3 text-left">Model</th>

                                                    <th className="p-3 text-left">Time (s)</th>

                                                    <th className="p-3 text-left">Response Size</th>

                                                    <th className="p-3 text-left">Vulnerabilities</th>

                                                    <th className="p-3 text-left">Score</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {modelComparisons.map((result, index) => (
                                                    <tr key={index} className="border-t">
                                                        <td className="p-3 font-semibold">
                                                            {result.model}
                                                        </td>

                                                        <td className="p-3">{result.executionTime}</td>

                                                        <td className="p-3">{result.responseLength}</td>

                                                        <td className="p-3">{result.vulnerabilityCount}</td>

                                                        <td className="p-3">{result.score}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* USER INPUT */}
                    <div
                        className="
              bg-white
              rounded-2xl
              shadow
              p-4
            "
                    >
                        <h2 className="text-lg font-bold mb-2">
                            {mode === "generation"
                                ? "Description des besoins"
                                : "Code à analyser"}
                        </h2>

                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="
                w-full
                h-40
                border
                rounded-xl
                p-3
                resize-none
              "
                            placeholder={
                                mode === "generation"
                                    ? "Décrivez les besoins de votre application..."
                                    : "Collez le code à analyser..."
                            }
                        />
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div
                    className="
            w-[18%]
            bg-purple-500
            border-l
            p-4
            overflow-y-auto
          "
                >
                    <div className="bg-gray-300 p-4 rounded-xl mb-6">
                        <h2 className="text-black font-bold mb-2">Modèle LLM</h2>
                        <div className="flex gap-4 flex-wrap">
                            {["llama3", "mistral", "phi4"].map((model) => (
                                <label
                                    key={model}
                                    className="
                    flex
                    items-center
                    gap-2
                    bg-white
                    border
                    px-3
                    py-2
                    rounded-lg
                    cursor-pointer
                  "
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedModels.includes(model)}
                                        onChange={() => toggleModel(model)}
                                    />

                                    {model}
                                </label>
                            ))}
                            <div className="mt-2 text-sm text-gray-500">
                                Models selected: {selectedModels.join(", ")}
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold mb-4 text-white">Stratégies</h2>

                    {/* EMPTY */}
                    {strategies.length === 0 && (
                        <div className="text-white italic">Aucune stratégie chargée...</div>
                    )}

                    {/* STRATEGIES */}
                    <div className="space-y-3">
                        {strategies.map((strategy, index) => (
                            <label
                                key={strategy.id || index}
                                className="
                  flex
                  items-start
                  gap-3
                  p-3
                  bg-gray-600
                  text-white
                  rounded-xl
                  hover:bg-gray-700
                  transition
                  cursor-pointer
                "
                            >
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 mt-1"
                                    checked={selectedStrategies.some((s) => s.id === strategy.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedStrategies([...selectedStrategies, strategy]);
                                        } else {
                                            setSelectedStrategies(
                                                selectedStrategies.filter((s) => s.id !== strategy.id),
                                            );
                                        }
                                    }}
                                />

                                <div>
                                    <div className="font-bold">{strategy.title}</div>

                                    <div className="text-sm text-gray-300 mt-1">
                                        {strategy.prompt}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
