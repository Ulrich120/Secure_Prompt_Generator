import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

import { buildPrompt } from "../utils/promptBuilder";
import { runPromptChain } from "../utils/promptChain";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { exportAuditReport } from "../utils/pdfExporter";
import { analyzeSecurityFeatures } from "../utils/securityAnalyzer";
import { getInteractiveStrategyConfig } from "../strategies/interactiveStrategyConfig";

export default function Dashboard() {
  const { mode } = useParams();
  const currentMode = mode || "generation";
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  /* LLM MODELS */
  const models = [
    {
      label: "DeepSeek Chat V3",
      value: "deepseek/deepseek-chat-v3-0324",
    },
    {
      label: "Mistral Small",
      value: "mistralai/mistral-small-3.1-24b-instruct",
    },
    {
      label: "Qwen 2.5 Coder",
      value: "qwen/qwen-2.5-coder-32b-instruct",
    },
    {
      label: "Llama 3.3",
      value: "meta-llama/llama-3.3-70b-instruct",
    },
  ];

  const [model, setModel] = useState(models[0].value);

  /* USE STATE */
  const [scenarios, setScenarios] = useState([]);
  const [strategies, setStrategies] = useState([]);

  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [newStrategyTitle, setNewStrategyTitle] = useState("");
  const [newStrategyContent, setNewStrategyContent] = useState("");

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // Generic interactive multi-step strategy workflow
  const [interactiveExpanded, setInteractiveExpanded] = useState(false);
  const [interactiveCurrentStep, setInteractiveCurrentStep] = useState(1);
  const [interactiveCompletedSteps, setInteractiveCompletedSteps] = useState([]);
  const [interactivePreparedStep, setInteractivePreparedStep] = useState(null);

  const [messages, setMessages] = useState([]);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatLocked, setChatLocked] = useState(false);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const [chatDirty, setChatDirty] = useState(false);

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [newScenarioTitle, setNewScenarioTitle] = useState("");
  const [newScenarioContent, setNewScenarioContent] = useState("");
  const [editingScenario, setEditingScenario] = useState(null);
  const [showScenarioForm, setShowScenarioForm] = useState(false);

  const [savedConversations, setSavedConversations] = useState([]);
  const [historySearch, setHistorySearch] = useState("");

  const [securityChecks, setSecurityChecks] = useState([]);

  const bottomRef = useRef(null);
  const messagesRef = useRef([]);

  const storageKey = `secure_prompt_chat_${currentMode}`;

  const getSelectedInteractiveConfig = () =>
    getInteractiveStrategyConfig(selectedStrategy?.title);

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const resetInteractiveWorkflow = (expanded = false) => {
    setInteractiveExpanded(expanded);
    setInteractiveCurrentStep(1);
    setInteractiveCompletedSteps([]);
    setInteractivePreparedStep(null);
  };

  const restoreInteractiveWorkflow = (restoredMessages, strategy) => {
    const config = getInteractiveStrategyConfig(strategy?.title);

    if (!config) {
      resetInteractiveWorkflow(false);
      return;
    }

    const completed = new Set();
    const escapedTitle = config.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stepPattern = new RegExp(
      `${escapedTitle}\\s*[—-]\\s*Step\\s*(\\d+)`,
      "i",
    );

    restoredMessages
      .filter((message) => message.role === "user")
      .forEach((message) => {
        const match = String(message.content || "").match(stepPattern);

        if (!match) {
          return;
        }

        const stepNumber = Number(match[1]);

        if (stepNumber >= 1 && stepNumber <= config.steps.length) {
          completed.add(stepNumber);
        }
      });

    const completedSteps = [...completed].sort((a, b) => a - b);
    const highestCompleted =
      completedSteps.length > 0 ? Math.max(...completedSteps) : 0;

    setInteractiveExpanded(true);
    setInteractiveCompletedSteps(completedSteps);
    setInteractivePreparedStep(null);
    setInteractiveCurrentStep(
      highestCompleted >= config.steps.length
        ? config.steps.length
        : highestCompleted + 1,
    );
  };

  const refreshStrategies = async (modeToLoad = currentMode) => {
    const response = await fetch(`${API_URL}/strategies/${modeToLoad}`);

    const data = await response.json();
    setStrategies(data);
  };

  const createStrategy = async () => {
    try {
      await fetch(`${API_URL}/create-strategy`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode: currentMode,
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
      await fetch(`${API_URL}/update-strategy`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode: currentMode,
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
      await fetch(`${API_URL}/delete-strategy`, {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode: currentMode,
          title: strategy.title,
        }),
      });

      await refreshStrategies();

      if (selectedStrategy?.title === strategy.title) {
        setSelectedStrategy(null);
        resetInteractiveWorkflow(false);
        updateScenarioStrategyBubble(selectedScenario, null);
      }
    } catch (error) {
      console.error("Delete strategy error:", error);
    }
  };

  const uploadStrategy = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    try {
      const formData = new FormData();

      formData.append("file", file);

      formData.append("mode", currentMode);

      await fetch(`${API_URL}/upload-strategy`, {
        method: "POST",
        body: formData,
      });

      await refreshStrategies();
    } catch (error) {
      console.error(error);
    }
  };

  const refreshScenarios = async (modeToLoad = currentMode) => {
    const response = await fetch(`${API_URL}/scenarios/${modeToLoad}`);

    const data = await response.json();
    setScenarios(data);
  };

  const formatScenarioStrategyBubble = (scenario, strategy) => {
    return `📋 Scenario: ${scenario?.title || "No scenario selected"}

${scenario?.prompt || ""}

🎯 Strategy: ${strategy?.title || "No strategy selected"}

${strategy?.prompt || ""}`;
  };

  const updateScenarioStrategyBubble = (scenario, strategy) => {
    setMessages((previous) => {
      const withoutConfig = previous.filter(
        (message) => message.type !== "config",
      );

      // Do not display the configuration bubble until
      // both a scenario and a strategy are selected.
      if (!scenario || !strategy) {
        messagesRef.current = withoutConfig;
        return withoutConfig;
      }

      const content = formatScenarioStrategyBubble(scenario, strategy);

      const nextMessages = [
        {
          role: "user",
          type: "config",
          content,
          timestamp: getTime(),
        },
        ...withoutConfig,
      ];

      messagesRef.current = nextMessages;
      return nextMessages;
    });
  };

  const applyScenarioSelection = (scenario) => {
    setSelectedScenario(scenario);
    updateScenarioStrategyBubble(scenario, selectedStrategy);
  };

  const applyStrategySelection = (strategy) => {
    setSelectedStrategy(strategy);
    updateScenarioStrategyBubble(selectedScenario, strategy);

    const interactiveConfig =
      getInteractiveStrategyConfig(strategy?.title);

    resetInteractiveWorkflow(Boolean(interactiveConfig));
  };

  const requestChatChange = (type, value) => {
    const hasLLMResponse = messages.some(
      (message) =>
        message.role === "assistant" && message.type === "response",
    );

    const hasRealConversation = chatLocked && hasLLMResponse;

    // Before the first LLM response, the user can freely change the selection.
    if (!hasRealConversation) {
      if (type === "scenario") {
        applyScenarioSelection(value);
      }

      if (type === "strategy") {
        applyStrategySelection(value);
      }

      setConversationStarted(false);
      setActiveConversationId(null);
      return;
    }

    // After the first LLM response, changing the scenario or strategy
    // requires an explicit decision about the current conversation.
    setPendingChange({ type, value });
    setShowChangeDialog(true);
  };

  const prepareInteractiveStep = (step) => {
    const config = getSelectedInteractiveConfig();

    if (!config) {
      return;
    }

    const completed = interactiveCompletedSteps.includes(step.id);
    const isCurrentStep = step.id === interactiveCurrentStep;

    if (completed || !isCurrentStep) {
      return;
    }

    // Step 1 is automatically combined with the scenario and the initial
    // code/request. Keep the textarea unchanged so the source code is preserved.
    if (step.id === 1 && !conversationStarted) {
      setInteractivePreparedStep(1);
      return;
    }

    setInteractivePreparedStep(step.id);
    setUserInput(step.prompt);
  };

  const handleScenarioSelect = (scenario) => {
    requestChatChange("scenario", scenario);
  };

  const handleStrategySelect = (strategy) => {
    requestChatChange("strategy", strategy);
  };

  /* USE EFFECT */

  /* Reset the workspace and reload mode-specific data. */
  useEffect(() => {
    const handleModeChange = async () => {
      try {
        setLoading(true);

        setMessages([]);
        messagesRef.current = [];

        setSelectedScenario(null);
        setSelectedStrategy(null);
        resetInteractiveWorkflow(false);

        setConversationStarted(false);
        setActiveConversationId(null);
        setChatLocked(false);
        setChatDirty(false);

        setUserInput("");
        setHistorySearch("");
        setShowChangeDialog(false);
        setPendingChange(null);

        localStorage.removeItem(`secure_prompt_chat_${currentMode}`);

        await refreshScenarios(currentMode);
        await refreshStrategies(currentMode);
        await loadConversations(currentMode);
      } catch (error) {
        console.error("Mode change error:", error);
      } finally {
        setLoading(false);
      }
    };

    handleModeChange();
  }, [currentMode]);

  /* Keep messagesRef synchronized with React state. */
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* Scroll to the latest message. */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* Temporarily persist the current chat locally. */
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const sendToLLM = async () => {
    if (!selectedScenario || !selectedStrategy) {
      alert("Please select a scenario and a strategy.");
      return;
    }

    const trimmedInput = userInput.trim();
    const interactiveConfig = getSelectedInteractiveConfig();
    const isInteractive = Boolean(interactiveConfig);
    const interactiveCompleted =
      isInteractive &&
      interactiveCompletedSteps.length >= interactiveConfig.steps.length;

    if (
      !conversationStarted &&
      currentMode === "verification" &&
      !trimmedInput
    ) {
      alert("Please paste or upload the source code to analyze.");
      return;
    }

    if (
      isInteractive &&
      conversationStarted &&
      !interactiveCompleted &&
      interactivePreparedStep === null
    ) {
      alert(
        `Please select the next ${interactiveConfig.label} step before sending.`,
      );
      return;
    }

    if (!trimmedInput && conversationStarted) {
      return;
    }

    try {
      setLoading(true);

      const isFirstMessage = !conversationStarted;
      let promptToSend = "";
      let interactiveStepBeingSent = null;
      let displayedUserContent = trimmedInput;

      if (isFirstMessage) {
        if (isInteractive) {
          const stepOne = interactiveConfig.steps[0];

          interactiveStepBeingSent = stepOne.id;

          displayedUserContent =
            currentMode === "verification"
              ? `${stepOne.prompt}

Source code:

\`\`\`
${trimmedInput}
\`\`\``
              : `${stepOne.prompt}

Program request:

${trimmedInput || selectedScenario?.prompt || ""}`;

          promptToSend = `
${interactiveConfig.label} — Step ${stepOne.id}

Scenario:
${selectedScenario?.prompt || ""}

${displayedUserContent}
`;
        } else {
          promptToSend = buildPrompt({
            mode: currentMode,
            scenario: selectedScenario,
            strategy: selectedStrategy,
            userInput: trimmedInput,
          });
        }
      } else {
        interactiveStepBeingSent = isInteractive
          ? interactivePreparedStep
          : null;

        const previousConversation = messagesRef.current
          .filter((message) => message.type !== "config")
          .map((message) => `${message.role}: ${message.content}`)
          .join("\n\n");

        promptToSend = `
You are continuing the same conversation.

Previous conversation:
${previousConversation}

User question:
${trimmedInput}
`;
      }

      const userMessage = displayedUserContent
        ? {
            role: "user",
            type: "message",
            content: displayedUserContent,
            timestamp: getTime(),
          }
        : null;

      const result = await runPromptChain({
        generatedPrompt: promptToSend,
        selectedStrategy,
        selectedModel: model,
        mode: currentMode,
        scenario: selectedScenario,
        userInput: trimmedInput,
      });

      const assistantMessage = {
        role: "assistant",
        type: "response",
        content: result.finalResponse,
        timestamp: getTime(),
        securityChecks: analyzeSecurityFeatures(result.finalResponse),
      };

      const updatedMessages = [
        ...messagesRef.current,
        ...(userMessage ? [userMessage] : []),
        assistantMessage,
      ];

      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;

      setConversationStarted(true);
      setUserInput("");
      setChatDirty(true);
      setChatLocked(true);

      // An interactive step is completed only after a successful LLM response.
      if (isInteractive && interactiveStepBeingSent !== null) {
        const finishedStep = interactiveStepBeingSent;

        setInteractiveCompletedSteps((previous) =>
          previous.includes(finishedStep)
            ? previous
            : [...previous, finishedStep].sort((a, b) => a - b),
        );

        if (finishedStep < interactiveConfig.steps.length) {
          setInteractiveCurrentStep(finishedStep + 1);
        }

        setInteractivePreparedStep(null);
      }
    } catch (error) {
      console.error("LLM generation error:", error);

      const errorMessage = {
        role: "assistant",
        type: "error",
        content:
          "The request could not be completed. Please verify the backend connection and try again.",
        timestamp: getTime(),
      };

      const updatedMessages = [...messagesRef.current, errorMessage];

      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;
    } finally {
      setLoading(false);
    }
  };

  const uploadScenario = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("mode", currentMode);
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload-scenario`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("UPLOAD RESPONSE:", data);

      await refreshScenarios();

      event.target.value = "";
    } catch (error) {
      console.error("Scenario upload error:", error);
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

    const response = await fetch(`${API_URL}/create-scenario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: currentMode,
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

      await fetch(`${API_URL}/update-scenario`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode: currentMode,
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
      await fetch(`${API_URL}/delete-scenario`, {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode: currentMode,
          title: scenario.title,
        }),
      });

      await refreshScenarios();

      if (selectedScenario?.title === scenario.title) {
        setSelectedScenario(null);
        updateScenarioStrategyBubble(null, selectedStrategy);
      }
    } catch (error) {
      console.error("Delete scenario error:", error);
    }
  };

  const loadConversations = async (modeToLoad = currentMode) => {
    try {
      const response = await fetch(
        `${API_URL}/conversations?mode=${modeToLoad}`,
      );

      const data = await response.json();

      console.log("MODE HISTORIQUE:", modeToLoad);
      console.log("CONVERSATIONS:", data);

      setSavedConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load conversations error:", error);
      setSavedConversations([]);
    }
  };

  const saveConversation = async (messagesToSave = messagesRef.current) => {
    if (!messagesToSave || messagesToSave.length === 0) return;

    const hasLLMResponse = messagesToSave.some(
      (msg) => msg.role === "assistant",
    );

    if (!hasLLMResponse) return;

    const title = `${selectedScenario?.title || "Scenario"} - ${
      selectedStrategy?.title || "Strategy"
    }`;

    const payload = {
      mode: currentMode,
      title,
      scenario_title: selectedScenario?.title || "",
      strategy_title: selectedStrategy?.title || "",
      model,
      messages: messagesToSave,
    };

    if (activeConversationId) {
      await fetch(`${API_URL}/conversations/${activeConversationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } else {
      const response = await fetch(`${API_URL}/save-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.id) {
        setActiveConversationId(data.id);
      }
    }

    setChatDirty(false);
    await loadConversations();
  };

  const openConversation = async (id) => {
    setShowChangeDialog(false);
    setPendingChange(null);

    try {
      const response = await fetch(`${API_URL}/conversations/${id}`);

      if (!response.ok) {
        throw new Error(`Unable to load conversation ${id}.`);
      }

      const data = await response.json();
      const restoredMessages = Array.isArray(data.messages) ? data.messages : [];

      setMessages(restoredMessages);
      messagesRef.current = restoredMessages;

      const matchingScenario = scenarios.find(
        (scenario) => scenario.title === data.scenario_title,
      );

      const matchingStrategy = strategies.find(
        (strategy) => strategy.title === data.strategy_title,
      );

      setSelectedScenario(matchingScenario || null);
      setSelectedStrategy(matchingStrategy || null);
      restoreInteractiveWorkflow(restoredMessages, matchingStrategy);

      setConversationStarted(restoredMessages.length > 0);
      setActiveConversationId(data.id);
      setChatDirty(false);
      setChatLocked(
        restoredMessages.some(
          (message) =>
            message.role === "assistant" && message.type === "response",
        ),
      );
      setUserInput("");

      if (data.model) {
        setModel(data.model);
      }
    } catch (error) {
      console.error("Open conversation error:", error);
      alert("Unable to open this conversation.");
    }
  };

  const deleteSavedConversation = async (id) => {
    if (!window.confirm("Supprimer cette conversation ?")) return;

    await fetch(`${API_URL}/conversations/${id}`, {
      method: "DELETE",
    });

    await loadConversations();
  };

  const cancelChange = () => {
    setPendingChange(null);
    setShowChangeDialog(false);
  };

  const resetConversationState = () => {
    setMessages([]);
    messagesRef.current = [];
    setConversationStarted(false);
    setUserInput("");
    setActiveConversationId(null);
    setChatLocked(false);
    setChatDirty(false);
    setSecurityChecks([]);
    localStorage.removeItem(storageKey);
    resetInteractiveWorkflow(false);
  };

  const applyPendingChange = () => {
    if (!pendingChange) {
      return;
    }

    if (pendingChange.type === "scenario") {
      setSelectedScenario(pendingChange.value);
      updateScenarioStrategyBubble(pendingChange.value, selectedStrategy);
    }

    if (pendingChange.type === "strategy") {
      setSelectedStrategy(pendingChange.value);
      updateScenarioStrategyBubble(selectedScenario, pendingChange.value);

      const interactiveConfig =
        getInteractiveStrategyConfig(pendingChange.value?.title);

      resetInteractiveWorkflow(Boolean(interactiveConfig));
    }
  };

  const confirmChange = async () => {
    try {
      await saveConversation([...messagesRef.current]);
      resetConversationState();
      applyPendingChange();
    } catch (error) {
      console.error("Save and change error:", error);
      alert("The current conversation could not be saved.");
      return;
    }

    setPendingChange(null);
    setShowChangeDialog(false);
  };

  const confirmChangeWithoutSaving = () => {
    resetConversationState();
    applyPendingChange();
    setPendingChange(null);
    setShowChangeDialog(false);
  };

  const uploadCodeFile = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const allowedExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".txt",
      ".tsx",
      ".py",
      ".java",
      ".php",
      ".html",
      ".css",
      ".sql",
      ".json",
    ];

    const fileName = file.name.toLowerCase();

    const isAllowed = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isAllowed) {
      alert("File type not supported.");
      event.target.value = "";
      return;
    }

    const content = await file.text();

    setUserInput(content);

    event.target.value = "";
  };

  const startNewChat = async () => {
    try {
      await saveConversation([...messagesRef.current]);
    } catch (error) {
      console.error("New chat save error:", error);
      alert("The current conversation could not be saved.");
      return;
    }

    resetConversationState();
    setSelectedScenario(null);
    setSelectedStrategy(null);
  };

  const handleExportReport = () => {
    exportAuditReport({
      scenario: selectedScenario,
      strategy: selectedStrategy,
      model,
      messages,
    });
  };

  return (
    <>
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
            w-[22%]
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
              {/* SAVED CONVERSATIONS */}
              <h2 className="text-xl font-bold mb-4 text-white">📂 History</h2>

              <div className="mb-4 bg-white rounded-xl p-3 shadow">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="🔍 Search conversation..."
                  className="w-full p-2 mb-3 rounded-lg border text-black outline-none"
                />

                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-black">
                    💬 Saved Conversations
                  </h3>

                  <button
                    onClick={loadConversations}
                    className="
                      text-xs
                      bg-blue-500
                      hover:bg-blue-600
                      text-white
                      px-2
                      py-1
                      rounded-lg
                    "
                  >
                    🔄
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {savedConversations.length === 0 && (
                    <div className="text-xs text-gray-500 italic">
                      No saved conversations.
                    </div>
                  )}

                  {savedConversations
                    .filter((conversation) =>
                      conversation.title
                        ?.toLowerCase()
                        .includes(historySearch.toLowerCase()),
                    )
                    .map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`
                          flex
                          items-center
                          gap-2
                          rounded-lg
                          p-2
                          border
                          ${
                            activeConversationId === conversation.id
                              ? "bg-blue-100 border-blue-500"
                              : "bg-gray-100 border-gray-200"
                          }
                        `}
                      >
                        <button
                          onClick={() => openConversation(conversation.id)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="font-semibold text-sm text-black truncate">
                            💬 {conversation.title}
                          </div>

                          <div className="text-xs text-gray-500 truncate">
                            📂 {conversation.scenario_title || "No scenario"}
                          </div>

                          <div className="text-xs text-gray-500 truncate">
                            🧠 {conversation.strategy_title || "No strategy"}
                          </div>
                        </button>

                        <button
                          onClick={() =>
                            deleteSavedConversation(conversation.id)
                          }
                          className="
                            w-6
                            h-6
                            rounded-full
                            bg-red-500
                            hover:bg-red-600
                            text-white
                            text-xs
                            flex
                            items-center
                            justify-center
                            shrink-0
                          "
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <h2 className="text-xl font-bold mb-4 text-white">
                📂 Scenarios
              </h2>

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
                ➕ Upload scenario
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
                ✍️ Write scenario
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
                    placeholder="Describe the scenario"
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
                      <span className="block truncate">
                        📄 {scenario.title}
                      </span>
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
              <div
                className="
                p-4
                border-b
                shrink-0
                flex
                justify-between
                items-start
              "
              >
                {/* LEFT SIDE */}
                <div>
                  <h2 className="text-xl font-bold">💬 Chat with LLM</h2>

                  <p className="text-sm text-gray-500 mt-1">
                    The scenario and strategy are combined into a single user
                    chat bubble.
                  </p>
                </div>

                {/* RIGHT SIDE */}
                <button
                  onClick={startNewChat}
                  className="
                  px-4
                  py-2
                  bg-purple-500
                  hover:bg-purple-500
                  text-white
                  rounded-lg
                  text-sm
                  font-semibold
                  shrink-0
                "
                >
                  🧹 New Chat
                </button>

                <button
                  onClick={handleExportReport}
                  className="
                    px-4
                    py-2
                    bg-blue-500
                    hover:bg-blue-600
                    text-white
                    rounded-lg
                    text-sm
                    font-semibold
                  "
                >
                  📄 Export Report
                </button>
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
                    {!selectedScenario && !selectedStrategy
                      ? "Select a scenario and a strategy to prepare the prompt."
                      : !selectedScenario
                        ? "Now select a scenario."
                        : !selectedStrategy
                          ? "Now select a strategy."
                          : "The prompt is ready. You can send it to the LLM."}
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
                        <div
                          className={`
                            text-xs
                            font-bold
                            mb-2
                            flex
                            items-center
                            justify-between
                            gap-3
                            ${
                              message.role === "user"
                                ? "text-blue-700"
                                : "text-purple-700"
                            }
                          `}
                        >
                          <span>
                            {message.role === "user"
                              ? message.type === "config"
                                ? "👤 You — Scenario + Strategy"
                                : "👤 You"
                              : "🤖 LLM"}
                          </span>

                          {message.role === "assistant" && (
                            <button
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    message.content,
                                  );
                                  alert("Response copied.");
                                } catch (error) {
                                  console.error("Copy error:", error);
                                  alert("Unable to copy the response.");
                                }
                              }}
                              className="
                                px-2
                                py-1
                                text-xs
                                rounded-lg
                                bg-gray-500
                                hover:bg-purple-300
                                text-purple-800
                                transition
                              "
                            >
                              📋 Copy
                            </button>
                          )}
                        </div>
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

                        {message.role === "assistant" &&
                          message.securityChecks &&
                          message.securityChecks.length > 0 && (
                            <div className="mt-6 bg-white rounded-2xl border p-5 shadow-sm">
                              <h3 className="text-lg font-bold mb-4 text-purple-900">
                                🛡️ Security Checklist
                              </h3>

                              <div className="grid grid-cols-2 gap-3">
                                {message.securityChecks.map((check) => (
                                  <div
                                    key={check.label}
                                    className={`
                                      flex
                                      items-center
                                      gap-3
                                      rounded-xl
                                      px-4
                                      py-3
                                      text-sm
                                      font-semibold
                                      ${
                                        check.found
                                          ? "bg-green-50 text-green-700"
                                          : "bg-red-50 text-red-700"
                                      }
                                    `}
                                  >
                                    <span>{check.found ? "✅" : "❌"}</span>
                                    <span>{check.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                  {currentMode === "verification" && (
                    <label
                      className="
                        px-4
                        bg-gray-700
                        hover:bg-gray-800
                        text-white
                        rounded-xl
                        transition
                        font-semibold
                        flex
                        items-center
                        justify-center
                        cursor-pointer
                        shrink-0
                      "
                    >
                      📎 Code
                      <input
                        type="file"
                        accept=".js,.jsx,.ts,.tsx,.py,.java,.php,.html,.css,.sql,.json"
                        onChange={uploadCodeFile}
                        className="hidden"
                      />
                    </label>
                  )}

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
                    placeholder={
                      currentMode === "verification"
                        ? "Paste the code to analyze here..."
                        : "Type your request..."
                    }
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
                    {loading
                      ? "..."
                      : currentMode === "verification"
                        ? "Analyze"
                        : "Send"}
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
                <h2 className="text-black font-bold mb-2">🤖 LLM Model</h2>

                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="
                  w-full
                  p-2
                  rounded-lg
                  text-sm
                  text-black
                  outline-none
                  mb-2
                "
                >
                  {models.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-blue-700 break-all">{model}</p>

                <p className="text-sm text-gray-600">via OpenRouter</p>
              </div>

              <h2 className="text-xl font-bold mb-4 text-white">
                🧠 Strategies
              </h2>

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
                    🧠 The content will be saved as a prompt engineering
                    strategy.
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
                {strategies.map((strategy, index) => {
                  const isSelected =
                    selectedStrategy?.id === strategy.id;

                  const interactiveConfig =
                    getInteractiveStrategyConfig(strategy.title);

                  const isInteractive = Boolean(interactiveConfig);

                  return (
                    <div
                      key={strategy.id || index}
                      className="space-y-2"
                    >
                      {/* Main strategy card */}
                      <div
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
                            isSelected
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-gray-600 hover:bg-gray-700"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="strategy"
                          className="w-5 h-5 mt-1 shrink-0"
                          checked={isSelected}
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
                            {isInteractive
                              ? `Interactive ${interactiveConfig.steps.length}-step security workflow`
                              : strategy.prompt}
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

                      {/* Generic interactive strategy sub-steps */}
                      {isInteractive &&
                        isSelected &&
                        interactiveExpanded && (
                          <div
                            className="
                              ml-7
                              p-3
                              rounded-xl
                              border
                              border-blue-200
                              bg-blue-50
                              space-y-2
                            "
                          >
                            <div className="text-xs font-semibold text-blue-800 mb-2">
                              {interactiveConfig.label} —{" "}
                              {interactiveConfig.steps.length} interactive steps
                            </div>

                            {interactiveConfig.steps.map((step) => {
                              const completed =
                                interactiveCompletedSteps.includes(step.id);

                              const active =
                                step.id === interactiveCurrentStep &&
                                !completed;

                              return (
                                <button
                                  key={step.id}
                                  type="button"
                                  disabled={!active}
                                  onClick={() => prepareInteractiveStep(step)}
                                  className={`
                                    w-full
                                    flex
                                    items-center
                                    gap-3
                                    p-2.5
                                    rounded-lg
                                    text-left
                                    text-sm
                                    transition
                                    ${
                                      completed
                                        ? "bg-green-100 text-green-800"
                                        : active
                                          ? "bg-white text-blue-800 border border-blue-300 hover:bg-blue-100"
                                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }
                                  `}
                                >
                                  <span
                                    className="
                                      w-7
                                      h-7
                                      shrink-0
                                      rounded-full
                                      flex
                                      items-center
                                      justify-center
                                      font-bold
                                    "
                                  >
                                    {completed
                                      ? "✓"
                                      : active
                                        ? step.id
                                        : "🔒"}
                                  </span>

                                  <span className="flex-1">
                                    <span className="font-semibold">
                                      Step {step.id}
                                    </span>

                                    <span className="block text-xs mt-0.5">
                                      {step.shortTitle}
                                    </span>
                                  </span>

                                  {active && (
                                    <span className="text-xs font-semibold">
                                      Next
                                    </span>
                                  )}
                                </button>
                              );
                            })}

                            <div className="text-xs text-gray-500 pt-1">
                              {interactiveCompletedSteps.length ===
                              interactiveConfig.steps.length
                                ? `${interactiveConfig.label} completed.`
                                : "Select the active step to prepare its prompt. You decide when to send it."}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
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

      {/* CHANGE SCENARIO / STRATEGY DIALOG */}
      {showChangeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[430px]">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              ⚠️ Conversation in progress
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              You already started a conversation using:
            </p>

            <div className="bg-gray-100 rounded-xl p-4 mb-4 text-sm">
              <div className="mb-2">
                📂 <strong>Scenario:</strong>{" "}
                {selectedScenario?.title || "None"}
              </div>

              <div>
                🧠 <strong>Strategy:</strong>{" "}
                {selectedStrategy?.title || "None"}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Changing the scenario or strategy starts a new conversation.
              Choose whether to keep, discard, or save the current chat.
            </p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={cancelChange}
                className="
                px-4
                py-2
                rounded-lg
                bg-gray-200
                hover:bg-gray-300
                text-gray-800
                font-semibold
              "
              >
                Continue Current Chat
              </button>

              <button
                onClick={confirmChangeWithoutSaving}
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-red-500
                  hover:bg-red-600
                  text-white
                  font-semibold
                "
              >
                Continue without Saving
              </button>

              <button
                onClick={confirmChange}
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-blue-500
                  hover:bg-blue-600
                  text-white
                  font-semibold
                "
              >
                Save & Start New Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
