import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { exportSecurityReport } from "../utils/pdfExporter";
import SecurityRadar from "../components/SecurityRadar";

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

  const [selectedModel, setSelectedModel] = useState("llama3");

  const [llmResponse, setLlmResponse] = useState("");
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
        selectedModel,
      });

      const endTime = performance.now();
      setExecutionTime(((endTime - startTime) / 1000).toFixed(2));

      setLlmResponse(result.finalResponse);

      setHistory((prev) => [...prev, result.finalResponse]);

      setChainResults(result.steps || result.chainResults || []);

      // EXTRACT SECURITY SCORE
      const scoreMatch = result.finalResponse.match(/(\d{1,3})\/100/);

      if (scoreMatch) {
        const score = parseInt(scoreMatch[1]);

        setSecurityScore(score);

        if (score >= 80) {
          setRiskLevel("Low");
        } else if (score >= 50) {
          setRiskLevel("Medium");
        } else {
          setRiskLevel("High");
        }
      }
    } catch (error) {
      console.error(error);

      setLlmResponse("Erreur lors du prompt chaining.");
    } finally {
      setLoading(false);
    }
  };

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

                  ${
                    selectedScenario?.id === scenario.id
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

                      ${
                        securityScore >= 80
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

                      ${
                        riskLevel === "Low"
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

              {/* PROMPT CHAIN STEPS */}
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

                  {/*EXCUTION TIME*/}
                  {step.executionTime && (
                    <div className="text-xs text-gray-500 mb-3">
                      Execution Time: {step.executionTime}s
                    </div>
                  )}

                  <div className="prose max-w-none">
                    <MarkdownRenderer content={step.content} />
                  </div>
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
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-gray-300 w-full p-2 rounded-lg text-black"
            >
              <option value="llama3">LLaMA 3</option>
              <option value="mistral">Mistral</option>
              <option value="phi4">Phi-4</option>
              <option value="qwen">Qwen</option>
            </select>
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
