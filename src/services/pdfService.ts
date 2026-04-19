import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult, ProjectDetails } from '../types';

export const DISCLAIMER_TEXT = "THIS TOOL IS PROVIDED BY SAFETY ARGUMENT FOR BASIC RESEARCH AND GUIDANCE PURPOSES ONLY. THE INFORMATION GENERATED IS POWERED BY ARTIFICIAL INTELLIGENCE AND MAY CONTAIN INACCURACIES OR OMISSIONS. SAFETY ARGUMENT DOES NOT GUARANTEE REGULATORY COMPLIANCE OR TECHNICAL ACCURACY OF THE RESULTS. USERS ARE STRICTLY ADVISED TO CONSULT WITH QUALIFIED SAFETY PROFESSIONALS AND LEGAL EXPERTS BEFORE IMPLEMENTING ANY FINDINGS. SAFETY ARGUMENT ASSUMES NO LIABILITY FOR DAMAGES, LOSSES, OR LEGAL CONSEQUENCES ARISING FROM THE USE OF THIS TOOL OR RELIANCE ON ITS GENERATED REPORTS.";

export async function generateSystemOverviewReport(details: ProjectDetails, result: AnalysisResult) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30); // Dark Slate/Black
  doc.text('SAFETY ARGUMENT', 14, 22);
  
  doc.setFontSize(14);
  doc.text('System Overview Report', 14, 30);
  
  // Section 1: Project Input Data
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('1. Project Input Data', 14, 42);
  
  autoTable(doc, {
    startY: 44,
    head: [['Field', 'Value']],
    body: [
      ['Project Name', details.project],
      ['Jurisdiction', details.location],
      ['Application Type', details.application],
      ['Operational Context', details.context || 'N/A'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40] },
  });

  // Section 2: Identified Regulatory Landscape
  doc.setFontSize(14);
  doc.text('2. Identified Regulatory Landscape', 14, (doc as any).lastAutoTable.finalY + 15);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 19,
    head: [['Standard / Regulation Name']],
    body: result.foundStandards.map(name => [name]),
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40] },
  });

  // Section 3: Engineering Deliverables
  doc.setFontSize(14);
  doc.text('3. Engineering Deliverables & Governance', 14, (doc as any).lastAutoTable.finalY + 15);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 19,
    head: [['Deliverable', 'Description', 'Regulatory Basis']],
    body: result.nodes.map(node => [
      node.name,
      node.description,
      node.regulatoryReferences.join(', ')
    ]),
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 80 },
      2: { cellWidth: 60 },
    }
  });

  // Section 4: System Interfaces
  doc.addPage();
  doc.setFontSize(14);
  doc.text('4. System Interface Governance', 14, 20);
  
  autoTable(doc, {
    startY: 24,
    head: [['Interface (Source - Target)', 'Relationship Type', 'Substantiation (Standard Reference)']],
    body: result.links.map(link => {
      const getSourceId = (id: any) => typeof id === 'object' ? id.id : id;
      const sourceId = getSourceId(link.source);
      const targetId = getSourceId(link.target);
      
      const sourceNode = result.nodes.find(n => n.id === sourceId)?.name || sourceId;
      const targetNode = result.nodes.find(n => n.id === targetId)?.name || targetId;
      return [
        `${sourceNode} - ${targetNode}`,
        link.label,
        link.regulatoryBasis
      ];
    }),
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40] },
  });

  // Disclaimer
  let currentY = (doc as any).lastAutoTable.finalY + 20;
  
  if (currentY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150); // Grey
  doc.text('IMPORTANT DISCLAIMER', 14, currentY);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const splitDisclaimer = doc.splitTextToSize(DISCLAIMER_TEXT, pageWidth - 28);
  doc.text(splitDisclaimer, 14, currentY + 6);

  // Save the PDF
  doc.save(`System_Overview_${details.project.replace(/\s+/g, '_')}.pdf`);
}
