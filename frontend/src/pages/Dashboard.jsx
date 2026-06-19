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

  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [newStrategyTitle, setNewStrategyTitle] = useState("");
  const [newStrategyContent, setNewStrategyContent] = useState("");

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const [messages, setMessages] = useState([]);
  const [conversationStarted, setConversationStarted] = useState(false);

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [newScenarioTitle, setNewScenarioTitle] = useState("");
  const [newScenarioContent, setNewScenarioContent] = useState("");
  const [editingScenario, setEditingScenario] = useState(null);
  const [showScenarioForm, setShowScenarioForm] = useState(false);

  const bottomRef = useRef(null);

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const refreshStrategies = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/strategies/${mode}`);
      const data = await response.json();
      setStrategies(data);
    } catch (error) {
      console.error(error);
    }
  };

  const createStrategy = async () => {
    try {
      await fetch("http://127.0.0.1:8000/create-strategy", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode,
          title: newStrategyTitle,
          content: newStrategyContent,
        }),
      });

      await refreshStrategies();

      setNewStrategyTitle("");
      setNewStrategyContent("");
      setShowStrategyForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  const editStrategy = (strategy) => {
    setEditingStrategy(strategy);

    setNewStrategyTitle(strategy.title);

    setNewStrategyContent(strategy.prompt);

    setShowStrategyForm(true);
  };

  const updateStrategy = async () => {
    try {
      await fetch("http://127.0.0.1:8000/update-strategy", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode,
          old_title: editingStrategy.title,
          new_title: newStrategyTitle,
          content: newStrategyContent,
        }),
      });

      await refreshStrategies();

      setEditingStrategy(null);

      setNewStrategyTitle("");

      setNewStrategyContent("");

      setShowStrategyForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteStrategy = async (strategy) => {
    if (!window.confirm(`Delete "${strategy.title}" ?`)) {
      return;
    }

    try {
      await fetch("http://127.0.0.1:8000/delete-strategy", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode,
          title: strategy.title,
        }),
      });

      await refreshStrategies();
    } catch (error) {
      console.error(error);
    }
  };

  const uploadStrategy = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    try {
      const formData = new FormData();

      formData.append("file", file);

      formData.append("mode", mode);

      await fetch("http://127.0.0.1:8000/upload-strategy", {
        method: "POST",
        body: formData,
      });

      await refreshStrategies();
    } catch (error) {
      console.error(error);
    }
  };

  const refreshScenarios = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/scenarios/${mode}`);
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      console.error(error);
    }
  };

  const formatScenarioStrategyBubble = (scenario, strategy) => {
    return `📋 Scénario : ${scenario?.title || "Aucun scénario sélectionné"}

    ${scenario?.prompt || ""}

    🎯 Stratégie : ${strategy?.title || "Aucune stratégie sélectionnée"}

    ${strategy?.prompt || ""}`;
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
        await refreshScenarios();
      } catch (error) {
        console.error("Erreur lors du chargement des scénarios :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [mode]);

  useEffect(() => {
    refreshStrategies();
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

      await refreshScenarios();

      event.target.value = "";
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
      ${newScenarioContent
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `- ${line.replace(/^[-•]\s*/, "")}`)
        .join("\n")}`;

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

    await refreshScenarios();

    setNewScenarioTitle("");
    setNewScenarioContent("");
    setShowScenarioForm(false);
  };

  const editScenario = (scenario) => {
    setEditingScenario(scenario);

    setNewScenarioTitle(scenario.title);

    setNewScenarioContent(scenario.prompt);

    setShowScenarioForm(true);
  };

  const updateScenario = async () => {
    try {
      const formattedContent = newScenarioContent
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `- ${line.replace(/^[-•]\s*/, "")}`)
        .join("\n");

      await fetch("http://127.0.0.1:8000/update-scenario", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode,
          old_title: editingScenario.title,
          new_title: newScenarioTitle,
          content: formattedContent,
        }),
      });

      await refreshScenarios();

      setEditingScenario(null);
      setNewScenarioTitle("");
      setNewScenarioContent("");
      setShowScenarioForm(false);
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const deleteScenario = async (scenario) => {
    const confirmDelete = window.confirm(`Supprimer "${scenario.title}" ?`);

    if (!confirmDelete) return;

    try {
      await fetch("http://127.0.0.1:8000/delete-scenario", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode,
          title: scenario.title,
        }),
      });

      await refreshScenarios();

      if (selectedScenario?.title === scenario.title) {
        setSelectedScenario(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
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
          shrink-0
        "
      >
        🛡️ Secure Prompt Generator
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* LEFT PANEL */}
        <div
          className="
            w-[20%]
            bg-slate-700
            border-r
            p-4
            flex
            flex-col
            overflow-hidden
            min-w-0
          "
        >
          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
            <h2 className="text-xl font-bold mb-4 text-white">📂 Scénarios</h2>

            <p className="text-sm text-gray-300 italic mb-4">
              Select a Scenario
            </p>

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
                  placeholder="Title ... "
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
                  placeholder={`Describe the scenario`}
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

                <div className="text-xs text-gray-500 mb-3 leading-relaxed">
                  📄 The content will be automatically structured in the text
                  file.
                </div>

                <button
                  onClick={() =>
                    editingScenario ? updateScenario() : createScenario()
                  }
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
                  {editingScenario ? "💾 Update" : "💾 Save"}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {scenarios.map((scenario, index) => (
                <div
                  key={scenario.id || index}
                  className={`
                    flex
                    items-center
                    gap-2
                    w-full
                    p-3
                    rounded-xl
                    transition
                    text-white
                    overflow-hidden
                    ${
                      selectedScenario?.id === scenario.id
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-gray-500 hover:bg-gray-600"
                    }
                  `}
                >
                  <button
                    onClick={() => handleScenarioSelect(scenario)}
                    className="
                      flex-1
                      text-left
                      font-semibold
                      overflow-hidden
                      min-w-0
                    "
                  >
                    <span className="block truncate">📄 {scenario.title}</span>
                  </button>

                  <button
                    onClick={() => editScenario(scenario)}
                    className="
                      w-7
                      h-7
                      rounded-full
                      bg-yellow-400
                      hover:bg-yellow-500
                      flex
                      items-center
                      justify-center
                      shrink-0
                      text-sm
                    "
                    title="Modifier"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => deleteScenario(scenario)}
                    className="
                      w-7
                      h-7
                      rounded-full
                      bg-red-500
                      hover:bg-red-600
                      flex
                      items-center
                      justify-center
                      shrink-0
                      text-sm
                    "
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FIXED TIP */}
          <div
            className="
              shrink-0
              mt-2
              border
              border-blue-400
              rounded-xl
              p-2
              text-white
              text-sm
              bg-slate-800/40
            "
          >
            <div className="text-blue-300 font-bold mb-2">💡 Tip</div>
            Choose a scenario and a strategy, then begin interacting with the
            LLM.
          </div>
        </div>

        {/* CENTER PANEL */}
        <div
          className="
            w-[60%]
            flex
            flex-col
            bg-gray-100
            p-4
            overflow-hidden
            min-w-0
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
              min-w-0
            "
          >
            {/* CHAT HEADER */}
            <div className="p-4 border-b shrink-0">
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
                bg-gray-50
                min-w-0
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
                  className={`flex min-w-0 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[75%]
                      min-w-0
                      overflow-hidden
                      p-4
                      rounded-2xl
                      shadow-sm
                      leading-relaxed
                      break-words
                      [overflow-wrap:anywhere]
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

                    <div
                      className="
                        prose
                        max-w-none
                        min-w-0
                        leading-relaxed
                        break-words
                        [overflow-wrap:anywhere]
                        overflow-hidden
                        [&_*]:max-w-full
                        [&_*]:break-words
                        [&_*]:[overflow-wrap:anywhere]
                        [&_pre]:leading-relaxed
                        [&_pre]:overflow-x-auto
                        [&_code]:whitespace-pre-wrap
                      "
                    >
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
            <div className="p-4 border-t bg-white shrink-0">
              <div className="flex gap-3 min-w-0">
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
                    min-w-0
                  "
                  placeholder="Type ..."
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
                    shrink-0
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
            w-[22%]
            bg-purple-500
            border-l
            p-4
            flex
            flex-col
            overflow-hidden
            min-w-0
          "
        >
          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
            <div className="bg-gray-200 p-4 rounded-xl mb-6">
              <h2 className="text-black font-bold mb-2">🤖 Modèle LLM</h2>

              <p className="text-sm text-blue-700 break-all">{model}</p>

              <p className="text-sm text-gray-600">via OpenRouter</p>
            </div>

            <h2 className="text-xl font-bold mb-4 text-white">🧠 Stratégies</h2>

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
              ➕ Upload strategy
              <input
                type="file"
                accept=".txt"
                onChange={uploadStrategy}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowStrategyForm(!showStrategyForm)}
              className="
                mb-4
                w-full
                p-3
                rounded-xl
                bg-slate-700
                hover:bg-slate-800
                text-white
                font-semibold
                transition
              "
            >
              ✍️ Write strategy
            </button>

            {showStrategyForm && (
              <div
                className="
                  mb-4
                  bg-white
                  p-3
                  rounded-xl
                  border
                  border-purple-700
                "
              >
                <input
                  value={newStrategyTitle}
                  onChange={(e) => setNewStrategyTitle(e.target.value)}
                  placeholder="Strategy title ..."
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
                  value={newStrategyContent}
                  onChange={(e) => setNewStrategyContent(e.target.value)}
                  placeholder={`Describe the strategy.`}
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

                <div className="text-xs text-gray-500 mb-3 leading-relaxed">
                  🧠 The content will be saved as a prompt engineering strategy.
                </div>

                <button
                  onClick={() =>
                    editingStrategy ? updateStrategy() : createStrategy()
                  }
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
                  {editingStrategy ? "💾 Update" : "💾 Save"}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {strategies.map((strategy, index) => (
                <div
                  key={strategy.id || index}
                  className={`
                    flex
                    items-start
                    gap-2
                    w-full
                    p-3
                    rounded-xl
                    transition
                    text-white
                    overflow-hidden
                    ${
                      selectedStrategy?.id === strategy.id
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-gray-600 hover:bg-gray-700"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="strategy"
                    className="w-5 h-5 mt-1 shrink-0"
                    checked={selectedStrategy?.id === strategy.id}
                    onChange={() => handleStrategySelect(strategy)}
                  />

                  <button
                    onClick={() => handleStrategySelect(strategy)}
                    className="
                      flex-1
                      text-left
                      overflow-hidden
                      min-w-0
                    "
                  >
                    <div className="font-bold truncate">
                      ✨ {strategy.title}
                    </div>

                    <div className="text-sm text-gray-200 mt-1 line-clamp-3 break-words">
                      {strategy.prompt}
                    </div>
                  </button>

                  <button
                    onClick={() => editStrategy(strategy)}
                    className="
                      w-7
                      h-7
                      rounded-full
                      bg-yellow-400
                      hover:bg-yellow-500
                      flex
                      items-center
                      justify-center
                      shrink-0
                      text-sm
                    "
                    title="Update"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => deleteStrategy(strategy)}
                    className="
                      w-7
                      h-7
                      rounded-full
                      bg-red-500
                      hover:bg-red-600
                      flex
                      items-center
                      justify-center
                      shrink-0
                      text-sm
                    "
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FIXED TIP */}
          <div
            className="
              shrink-0
              mt-1
              border
              border-purple-200
              rounded-xl
              p-2
              text-white
              text-sm
              bg-purple-900/30
            "
          >
            <div className="text-purple-100 font-bold mb-2">💡 Tip</div>
            Select or create a strategy before sending the prompt to the LLM.
          </div>
        </div>
      </div>
    </div>
  );
}
