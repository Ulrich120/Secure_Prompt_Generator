import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportSecurityReport({
  selectedScenario,
  selectedStrategies,
  securityScore,
  riskLevel,
  generatedPrompt,
  llmResponse,
  chainResults,
}) {
  const doc = new jsPDF();

  let y = 15;

  doc.setFontSize(18);
  doc.text("Secure Prompt Generator Report", 10, y);

  y += 15;

  doc.setFontSize(12);

  doc.text( `Scenario: ${selectedScenario?.title || "N/A"}`, 10, y );

  y += 10;

  doc.text( `Security Score: ${securityScore ?? "N/A"}/100`, 10, y );

  y += 10;

  doc.text( `Risk Level: ${riskLevel || "N/A"}`, 10, y );

  y += 15;

  autoTable(doc, {
    startY: y,
    head: [["Strategy", "Executed"]],
    body: selectedStrategies.map((s) => [s.title, "Yes"]),
  });

  y = doc.lastAutoTable.finalY + 10;

  doc.text("Generated Prompt:", 10, y);

  y += 10;

  const promptLines = doc.splitTextToSize( generatedPrompt, 180 );

  doc.text(promptLines, 10, y);

  y += promptLines.length * 6 + 10;

  if (y > 250) {
    doc.addPage(); 
    y = 20;
  }

  doc.text("Final Analysis:", 10, y);

  y += 10;

  const responseLines = doc.splitTextToSize(
    llmResponse, 180 );

  doc.text(responseLines, 10, y);

  y += responseLines.length * 6 + 10;

  chainResults.forEach((step) => {

    if (y > 240) { doc.addPage(); y = 20;}

    doc.setFontSize(14);

    doc.text(step.title || step.step, 10, y);

    y += 8;

    doc.setFontSize(10);

    const lines = doc.splitTextToSize(
      step.content, 180);

    doc.text(lines, 10, y);

    y += lines.length * 5 + 10;
  });

  doc.save(`security-report-${Date.now()}.pdf`);
}