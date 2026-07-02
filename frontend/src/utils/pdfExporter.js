import jsPDF from "jspdf";

function cleanText(text = "") {
  return text
    .replace(/[📋🎯🤖👤🧠📂🛡️⚠️✅❌💬]/g, "")
    .replace(/\*\*/g, "")
    .trim();
}

function addPageIfNeeded(pdf, y, needed = 15) {
  if (y + needed > 280) {
    pdf.addPage();
    return 20;
  }

  return y;
}

function addSectionTitle(pdf, title, y) {
  y = addPageIfNeeded(pdf, y, 15);

  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(15, y, 180, 9, 2, 2, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(title, 20, y + 6);

  return y + 14;
}

function addWrappedText(pdf, text, x, y, maxWidth, lineHeight = 5) {
  const lines = pdf.splitTextToSize(cleanText(text), maxWidth);

  lines.forEach((line) => {
    y = addPageIfNeeded(pdf, y, lineHeight);
    pdf.text(line, x, y);
    y += lineHeight;
  });

  return y;
}

function addCodeBlock(pdf, code, y) {
  const lines = pdf.splitTextToSize(code, 165);

  y = addPageIfNeeded(pdf, y, 12);

  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(18, y - 4, 174, lines.length * 4.5 + 6, 2, 2, "F");

  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(40, 40, 40);

  lines.forEach((line) => {
    y = addPageIfNeeded(pdf, y, 5);
    pdf.text(line, 22, y);
    y += 4.5;
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  return y + 6;
}

function addVulnerabilityTable(pdf, vulnerabilities, y) {
  if (!vulnerabilities.length) return y;

  y = addSectionTitle(pdf, "Executive Summary", y);

  pdf.setFillColor(230, 230, 230);
  pdf.rect(15, y, 140, 10, "F");
  pdf.rect(155, y, 40, 10, "F");

  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);

  pdf.text("Vulnerability", 20, y + 6);
  pdf.text("Severity", 160, y + 6);

  y += 8;

  vulnerabilities.forEach((vuln) => {
    y = addPageIfNeeded(pdf, y, 10);

    pdf.setDrawColor(210, 210, 210);
    pdf.rect(15, y, 140, 10);
    pdf.rect(155, y, 40, 10);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");

    const nameLines = pdf.splitTextToSize(vuln.name, 110);
    pdf.text(nameLines[0], 20, y + 6);

    let color = [0, 0, 0];

    switch (vuln.severity.toLowerCase()) {
      case "critical":
        color = [220, 38, 38];
        break;
      case "high":
        color = [245, 158, 11];
        break;
      case "medium":
        color = [59, 130, 246];
        break;
      case "low":
        color = [34, 197, 94];
        break;
    }

    if (vuln.severity.toLowerCase() === "critical") {
      pdf.setFillColor(254, 226, 226);
    } else if (vuln.severity.toLowerCase() === "high") {
      pdf.setFillColor(255, 237, 213);
    } else if (vuln.severity.toLowerCase() === "medium") {
      pdf.setFillColor(219, 234, 254);
    } else {
      pdf.setFillColor(220, 252, 231);
    }

    pdf.rect(155, y, 40, 10, "F");
    pdf.rect(155, y, 40, 10);

    pdf.setTextColor(...color);
    pdf.setFont("helvetica", "bold");

    const severityLabel =
      vuln.severity.toLowerCase() === "critical"
        ? "CRITICAL"
        : vuln.severity.toLowerCase() === "high"
          ? "HIGH"
          : vuln.severity.toLowerCase() === "medium"
            ? "MEDIUM"
            : "LOW";

    pdf.text(severityLabel, 160, y + 6);

    pdf.setTextColor(0, 0, 0);

    y += 8;
  });

  return y + 10;
}

function extractSecurityScore(content = "") {
  const match = content.match(/score[: ]+([0-9]+)\/10/i);

  if (!match) return null;

  return parseInt(match[1]);
}

function extractVulnerabilities(content = "") {
  const vulnerabilities = [];
  const lines = content.split("\n");

  let currentName = null;

  const ignoredTitles = [
    "summary",
    "vulnerabilities found",
    "secure corrected code",
    "remediation steps",
    "final security score",
  ];

  lines.forEach((line) => {
    const trimmed = line
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/, "")
      .replace(/^-+\s*/, "")
      .trim();

    const vulnMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

    if (vulnMatch) {
      const candidate = vulnMatch[2].trim();

      const isIgnored = ignoredTitles.some((title) =>
        candidate.toLowerCase().includes(title),
      );

      if (!isIgnored) {
        currentName = candidate;
      }
    }

    const severityMatch = trimmed.match(
      /severity\s*:\s*(critical|high|medium|low)/i,
    );

    if (currentName && severityMatch) {
      vulnerabilities.push({
        name: currentName,
        severity: severityMatch[1],
      });

      currentName = null;
    }
  });

  return vulnerabilities;
}

function addLLMResponse(pdf, content, y) {
  const text = cleanText(content);
  const parts = text.split(/```/);

  parts.forEach((part, index) => {
    const isCode = index % 2 === 1;

    if (isCode) {
      y = addCodeBlock(
        pdf,
        part.replace(/^javascript|^python|^js/, "").trim(),
        y,
      );
      return;
    }

    const lines = part.split("\n");

    lines.forEach((line) => {
      const cleanLine = line.trim();

      if (!cleanLine) {
        y += 3;
        return;
      }

      const isMainTitle =
        cleanLine.match(/^#+\s/) ||
        cleanLine.match(/^\d+\.\s/) ||
        cleanLine.toLowerCase().includes("summary") ||
        cleanLine.toLowerCase().includes("vulnerabilities found") ||
        cleanLine.toLowerCase().includes("secure corrected code") ||
        cleanLine.toLowerCase().includes("remediation steps") ||
        cleanLine.toLowerCase().includes("final security score");

      const isSeverity =
        cleanLine.toLowerCase().includes("severity:") ||
        cleanLine.toLowerCase().includes("critical") ||
        cleanLine.toLowerCase().includes("high") ||
        cleanLine.toLowerCase().includes("medium") ||
        cleanLine.toLowerCase().includes("low");

      if (isMainTitle) {
        y = addPageIfNeeded(pdf, y, 12);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(30, 64, 175);

        y = addWrappedText(pdf, cleanLine.replace(/^#+\s*/, ""), 18, y, 170, 5);

        y += 2;
      } else if (isSeverity) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(180, 83, 9);

        y = addWrappedText(pdf, cleanLine, 22, y, 165, 5);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(30, 30, 30);

        y = addWrappedText(pdf, cleanLine, 22, y, 165, 5);
      }
    });
  });

  return y;
}

export function exportAuditReport({ scenario, strategy, model, messages }) {
  const pdf = new jsPDF("p", "mm", "a4");

  // COVER PAGE
  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, 210, 297, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.text("SECURITY AUDIT REPORT", 105, 70, { align: "center" });

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");

  pdf.text(`Scenario: ${scenario?.title || "N/A"}`, 105, 105, {
    align: "center",
  });

  pdf.text(`Strategy: ${strategy?.title || "N/A"}`, 105, 118, {
    align: "center",
  });

  pdf.text(`Model: ${model || "N/A"}`, 105, 131, {
    align: "center",
  });

  pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 144, {
    align: "center",
  });

  pdf.setFontSize(11);
  pdf.text("Secure Prompt Generator", 105, 230, {
    align: "center",
  });

  pdf.addPage();

  let y = 18;

  // HEADER
  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, 210, 30, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Secure Prompt Generator", 15, 13);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text("Security Audit Report", 15, 22);

  y = 42;

  // REPORT INFO
  pdf.setTextColor(0, 0, 0);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(15, y, 180, 42, 3, 3, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Report Information", 20, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Scenario: ${scenario?.title || "N/A"}`, 20, y + 17);
  pdf.text(`Strategy: ${strategy?.title || "N/A"}`, 20, y + 24);
  pdf.text(`Model: ${model || "N/A"}`, 20, y + 31);
  pdf.text(`Date: ${new Date().toLocaleString()}`, 20, y + 38);

  y += 55;

  const userMessages = messages.filter((msg) => msg.role === "user");
  const assistantMessages = messages.filter((msg) => msg.role === "assistant");

  const userCode = userMessages[userMessages.length - 1]?.content || "";
  const llmResponse =
    assistantMessages[assistantMessages.length - 1]?.content || "";

  const score = extractSecurityScore(llmResponse);
  const vulnerabilities = extractVulnerabilities(llmResponse);

  // SECURITY SCORE CARD
  if (score !== null) {
    let color = [34, 197, 94];
    let label = "Excellent";

    if (score <= 3) {
      color = [220, 38, 38];
      label = "Critical Risk";
    } else if (score <= 6) {
      color = [245, 158, 11];
      label = "Medium Risk";
    } else if (score <= 8) {
      color = [59, 130, 246];
      label = "Good";
    }

    pdf.setFillColor(...color);
    pdf.roundedRect(15, y, 180, 28, 4, 4, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(`Security Score: ${score}/10`, 20, y + 12);

    pdf.setFontSize(10);
    pdf.text(label, 20, y + 22);

    pdf.setTextColor(0, 0, 0);

    y += 40;
  }

  y = addVulnerabilityTable(pdf, vulnerabilities, y);

  // CODE ANALYZED
  y = addSectionTitle(pdf, "Code Analyzed", y);

  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(40, 40, 40);
  y = addCodeBlock(pdf, userCode, y);

  // LLM RESPONSE
  y = addSectionTitle(pdf, "LLM Security Audit Response", y);
  y = addLLMResponse(pdf, llmResponse, y);

  // FOOTER
  const pageCount = pdf.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Secure Prompt Generator - Page ${i} of ${pageCount}`, 15, 290);
  }

  pdf.save(`Security_Audit_Report_${Date.now()}.pdf`);
}
