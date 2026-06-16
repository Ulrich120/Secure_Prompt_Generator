import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { buildPrompt } from "../utils/promptBuilder";
import { runPromptChain } from "../utils/promptChain";
import MarkdownRenderer from "../components/MarkdownRenderer";

export default function Dashboard() {
  // ROUTER PARAMS
  const { mode } = useParams();

  // STATES
  const [scenarios, setScenarios] = useState([]);
  const [strategies, setStrategies] = useState([]);

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const [userInput, setUserInput] = useState("");

  const [llmResponse, setLlmResponse] = useState("");

  const [chainResults, setChainResults] = useState([]);

  const [loading, setLoading] = useState(false);

  // LOAD SCENARIOS
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);

        const response = await fetch(`http://127.0.0.1:8000/scenarios/${mode}`);

        const data = await response.json();

        setScenarios(data);
      } catch (error) {
        console.error("Erreur lors du chargement des scénarios :", error);
      } finally {
        setLoading(false);
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
    setSelectedStrategy(null);

    setUserInput("");

    setLlmResponse("");

    setChainResults([]);

  }, [mode]);

  // BUILD PROMPT
  const generatedPrompt = buildPrompt({
    mode,
    scenario: selectedScenario,
    strategy: selectedStrategy,
    userInput,
  });

  // SEND TO LLM
  const sendToLLM = async () => {
    try {
      setLoading(true);

      const result = await runPromptChain({
        generatedPrompt,
        selectedStrategy,
      });

      setLlmResponse(result.finalResponse);

      setChainResults(result.steps || result.chainResults || []);

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
          {loading && (
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
              <h2 className="text-xl font-bold">
                Réponse du LLM
              </h2>
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
                  <h3 className="font-bold mb-2">
                    {step.title}
                  </h3>

                  {step.prompt && (
                    <div className="mb-4">
                      <div className="font-semibold text-sm text-gray-600 mb-2">
                        Prompt utilise.
                      </div>

                      <textarea
                        readOnly
                        value={step.prompt}
                        className="
                          w-full
                          h-40
                          border
                          rounded-lg
                          p-3
                          bg-gray-50
                          text-sm
                        "
                      />
                    </div>
                  )}

                  <div className="prose max-w-none">
                    <MarkdownRenderer content={step.content} />
                  </div>

                </div>
              ))}

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
            <h2 className="text-black font-bold mb-2">
              Modèle LLM
            </h2>
            <p2>llama3</p2>
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
                  type="radio"
                  name="strategy"
                  className="w-5 h-5 mt-1"
                  checked={selectedStrategy?.id === strategy.id}
                  onChange={() => setSelectedStrategy(strategy)}
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
