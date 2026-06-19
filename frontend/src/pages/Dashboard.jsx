import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

import { buildPrompt } from "../utils/promptBuilder";
import { runPromptChain } from "../utils/promptChain";
import MarkdownRenderer from "../components/MarkdownRenderer";

export default function Dashboard() {
  const { mode } = useParams();

  const model = "deepseek/deepseek-chat-v3-0324";

  const [scenarios, setScenarios] = useState([]);
  const [strategies, setStrategies] = useState([]);

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const [messages, setMessages] = useState([]);
  const [conversationStarted, setConversationStarted] = useState(false);

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  const [newScenarioTitle, setNewScenarioTitle] = useState("");
  const [newScenarioContent, setNewScenarioContent] = useState("");
  const [showScenarioForm, setShowScenarioForm] = useState(false);

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatScenarioStrategyBubble = (scenario, strategy) => {
    return `
      📋 Scénario : ${scenario?.title || "Aucun scénario sélectionné"}

      ${scenario?.prompt || ""}

      🎯 Stratégie : ${strategy?.title || "Aucune stratégie sélectionnée"}

      ${strategy?.prompt || ""}
    `;
  };

  const updateScenarioStrategyBubble = (scenario, strategy) => {
    const content = formatScenarioStrategyBubble(scenario, strategy);

    setMessages((prev) => {
      const withoutConfig = prev.filter((msg) => msg.type !== "config");

      return [
        {
          role: "user",
          type: "config",
          content,
          timestamp: getTime(),
        },
        ...withoutConfig,
      ];
    });
  };

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);

    updateScenarioStrategyBubble(scenario, selectedStrategy);

    setConversationStarted(false);
  };

  const handleStrategySelect = (strategy) => {
    setSelectedStrategy(strategy);

    updateScenarioStrategyBubble(selectedScenario, strategy);

    setConversationStarted(false);
  };

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

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/strategies/${mode}`,
        );

        const data = await response.json();

        setStrategies(data);
      } catch (error) {
        console.error("Erreur lors du chargement des stratégies :", error);
      }
    };

    fetchStrategies();
  }, [mode]);

  useEffect(() => {
    setSelectedScenario(null);
    setSelectedStrategy(null);
    setMessages([]);
    setConversationStarted(false);
    setUserInput("");
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendToLLM = async () => {
    if (!selectedScenario || !selectedStrategy) {
      alert("Veuillez sélectionner un scénario et une stratégie.");
      return;
    }

    if (!userInput.trim() && conversationStarted) {
      return;
    }

    try {
      setLoading(true);

      let promptToSend = "";

      if (!conversationStarted) {
        promptToSend = buildPrompt({
          mode,
          scenario: selectedScenario,
          strategy: selectedStrategy,
          userInput,
        });

        setConversationStarted(true);
      } else {
        promptToSend = `
          You are continuing a conversation.

          Previous conversation:
          ${messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n\n")}

          User question:
          ${userInput}
        `;
      }

      if (userInput.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            type: "message",
            content: userInput,
            timestamp: getTime(),
          },
        ]);
      }

      const result = await runPromptChain({
        generatedPrompt: promptToSend,
        selectedStrategy,
        selectedModel: model,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "response",
          content: result.finalResponse,
          timestamp: getTime(),
        },
      ]);

      setUserInput("");
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "error",
          content: "Erreur lors de la génération.",
          timestamp: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const uploadScenario = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("mode", mode);
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload-scenario", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("UPLOAD RESPONSE:", data);

      const refresh = await fetch(`http://127.0.0.1:8000/scenarios/${mode}`);

      const scenariosData = await refresh.json();

      setScenarios(scenariosData);
    } catch (error) {
      console.error("Erreur upload scénario :", error);
    }
  };

  const createScenario = async () => {
    if (!newScenarioTitle.trim() || !newScenarioContent.trim()) {
      alert("Veuillez entrer un titre et un contenu.");
      return;
    }

    const formattedContent = `
      Task:
      ${newScenarioTitle}

      Requirements:
      ${newScenarioContent
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `- ${line}`)
        .join("\n")}
      `;

    const response = await fetch("http://127.0.0.1:8000/create-scenario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        title: newScenarioTitle,
        content: formattedContent,
      }),
    });

    await response.json();

    const refresh = await fetch(`http://127.0.0.1:8000/scenarios/${mode}`);

    const data = await refresh.json();

    setScenarios(data);

    setNewScenarioTitle("");
    setNewScenarioContent("");
    setShowScenarioForm(false);
  };

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
        🛡️ Secure Prompt Generator
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div
          className="
            w-[18%]
            bg-slate-700
            border-r
            p-4
            overflow-y-auto
            flex
            flex-col
          "
        >
          <h2 className="text-xl font-bold mb-4 text-white">📂 Scénarios</h2>

          <p className="text-sm text-gray-300 italic mb-4">Select a Scenario</p>

          <label
            className="
              mb-3
              w-full
              p-3
              rounded-xl
              bg-green-500
              hover:bg-green-600
              text-white
              font-semibold
              text-center
              cursor-pointer
              transition
              block
            "
          >
            ➕ Upload scénario
            <input
              type="file"
              accept=".txt"
              onChange={uploadScenario}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowScenarioForm(!showScenarioForm)}
            className="
              mb-4
              w-full
              p-3
              rounded-xl
              bg-purple-500
              hover:bg-purple-600
              text-white
              font-semibold
              transition
            "
          >
            ✍️ Write scénario
          </button>

          {showScenarioForm && (
            <div
              className="
                mb-4
                bg-white
                p-3
                rounded-xl
                border
                border-slate-500
    "
            >
              <input
                value={newScenarioTitle}
                onChange={(e) => setNewScenarioTitle(e.target.value)}
                placeholder="Title ..."
                className="
                  w-full
                  mb-2
                  p-2
                  rounded
                  text-black
                  outline-none
                "
              />

              <textarea
                value={newScenarioContent}
                onChange={(e) => setNewScenarioContent(e.target.value)}
                placeholder={`Décris le scénario ici...

                  Exemple :
                  Créer un système de connexion sécurisé.

                  Exigences :
                  - inscription utilisateur
                  - connexion utilisateur
                  - hachage bcrypt
                  - JWT
                  - validation des entrées`}
                className="
                    w-full
                    h-40
                    mb-2
                    p-2
                    rounded
                    text-black
                    resize-none
                    outline-none
                  "
              />

              <div className="text-xs text-gray-300 mb-3 leading-relaxed">
                Le contenu sera automatiquement structuré dans le fichier texte.
              </div>

              <button
                onClick={createScenario}
                className="
                  w-full
                  p-2
                  rounded
                  bg-green-500
                  hover:bg-green-600
                  text-white
                  font-semibold
                "
              >
                💾 Save
              </button>
            </div>
          )}

          <div className="space-y-3">
            {scenarios.map((scenario, index) => (
              <button
                key={scenario.id || index}
                onClick={() => handleScenarioSelect(scenario)}
                className={`
                  w-full
                  p-4
                  rounded-xl
                  transition
                  font-semibold
                  text-white
                  text-left

                  ${
                    selectedScenario?.id === scenario.id
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-500 hover:bg-gray-600"
                  }
                `}
              >
                📄 {scenario.title}
              </button>
            ))}
          </div>

          <div className="mt-auto border border-blue-400 rounded-xl p-4 text-white text-sm">
            <div className="text-blue-300 font-bold mb-2">💡 Tip </div>
            Choose a scenario and a strategy, then begin interacting with the
            LLM.
          </div>
        </div>

        {/* CENTER PANEL */}
        <div
          className="
            w-[64%]
            flex
            flex-col
            bg-gray-100
            p-4
            overflow-hidden
          "
        >
          <div
            className="
              bg-white
              rounded-2xl
              shadow
              flex
              flex-col
              flex-1
              overflow-hidden
            "
          >
            {/* CHAT HEADER */}
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">💬 Chat with LLM</h2>

              <p className="text-sm text-gray-500 mt-1">
                The scenario and strategy are combined into a single user chat
                bubble.
              </p>
            </div>

            {/* CHAT MESSAGES */}
            <div
              className="
                flex-1
                overflow-y-auto
                overflow-x-hidden
                p-6
                space-y-5
                break-words
                bg-gray-50
              "
            >
              {messages.length === 0 && (
                <div className="text-center text-gray-400 italic mt-20">
                  🚀 Select a scenario and a strategy to get started.
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[75%] 
                      overflow-hidden 
                      break-words 
                      whitespace-pre-wrap
                      p-4
                      rounded-2xl
                      shadow-sm
                      ${
                        message.role === "user"
                          ? "bg-blue-100 text-gray-900 border border-blue-400"
                          : "bg-purple-100 text-purple-950 border border-purple-300"
                      }
                    `}
                  >
                    <div
                      className={`
                        text-xs
                        font-bold
                        mb-2
                        ${
                          message.role === "user"
                            ? "text-blue-700"
                            : "text-purple-700"
                        }
                      `}
                    >
                      {message.role === "user"
                        ? message.type === "config"
                          ? "👤 You — Scénario + Stratégie"
                          : "👤 You"
                        : "🤖 LLM"}
                    </div>

                    <div className="prose max-w-none whitespace-pre-wrap break-words overflow-hidden">
                      <MarkdownRenderer content={message.content} />
                    </div>

                    {message.timestamp && (
                      <div className="text-right text-xs text-gray-400 mt-2">
                        {message.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-purple-100 border border-purple-200 p-4 rounded-2xl shadow-sm text-purple-800 italic">
                    🤖 Thinking ...
                  </div>
                </div>
              )}

              <div ref={bottomRef}></div>
            </div>

            {/* CHAT INPUT */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-3">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendToLLM();
                    }
                  }}
                  className="
                    flex-1
                    h-16
                    border
                    rounded-xl
                    p-3
                    resize-none
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-400
                  "
                  placeholder={conversationStarted ? "Type ..." : "Type ..."}
                />

                <button
                  onClick={sendToLLM}
                  className="
                    px-6
                    bg-blue-500
                    hover:bg-blue-700
                    text-white
                    rounded-xl
                    transition
                    font-semibold
                  "
                >
                  {loading ? "..." : "Send"}
                </button>
              </div>
            </div>
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
          <div className="bg-gray-200 p-4 rounded-xl mb-6">
            <h2 className="text-black font-bold mb-2">🤖 Modèle LLM</h2>

            <p className="text-sm text-blue-700 break-all">{model}</p>

            <p className="text-sm text-gray-600">via OpenRouter</p>
          </div>

          <h2 className="text-xl font-bold mb-4 text-white">🧠 Stratégies</h2>

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
                  onChange={() => handleStrategySelect(strategy)}
                />

                <div>
                  <div className="font-bold">✨ {strategy.title}</div>

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
