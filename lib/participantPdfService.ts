import { jsPDF } from 'jspdf';
import { Participant, RestrictivePracticeProtocol } from '../types';

/**
 * Breakthrough Manager OS - NDIS Audit PDF Engine
 * Generates official, NDIS Quality and Safeguards Commission-compliant
 * participant profiles, care plans, and audit documentation.
 */

export interface AuditPdfOptions {
  includeProtocols?: boolean;
  protocols?: RestrictivePracticeProtocol[];
  auditorName?: string;
  auditorRole?: string;
  auditNotes?: string;
}

/**
 * Calculates age from DOB
 */
function calculateAge(dobString: string): string {
  try {
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return isNaN(age) ? 'N/A' : `${age} years`;
  } catch {
    return 'N/A';
  }
}

/**
 * Generates an official NDIS Audit PDF for a single participant
 */
export function generateParticipantAuditPdf(
  participant: Participant,
  options: AuditPdfOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Helper to check page break
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      y = margin;
      renderHeaderCompact();
    }
  };

  // Header renderer
  const renderHeader = () => {
    // Top banner background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 24, 'F');

    // Title text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('BREAKTHROUGH SUPPORT SERVICES', margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('NDIS Registered Provider #4050019283 | Quality & Safeguards Commission Compliance', margin + 4, y + 13);
    doc.text(`Official Audit Record | Generated: ${new Date().toLocaleString('en-AU')} | Secure ID: ${participant.id}`, margin + 4, y + 19);

    // Right-hand badge
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(pageWidth - margin - 38, y + 5, 34, 14, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('NDIS AUDIT READY', pageWidth - margin - 36, y + 11);
    doc.setFontSize(6.5);
    doc.text('PROTECTED HEALTH DATA', pageWidth - margin - 36, y + 16);

    y += 28;
  };

  // Compact header on subsequent pages
  const renderHeaderCompact = () => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Participant: ${participant.fullName} | NDIS: ${participant.ndisNumber} | Plan Audit Evidence`, margin + 3, y + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 15, y + 6.5);
    y += 14;
  };

  // Section heading helper
  const renderSectionHeader = (title: string, iconNumber: string) => {
    ensureSpace(12);
    doc.setFillColor(226, 232, 240); // slate-200
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`${iconNumber}. ${title.toUpperCase()}`, margin + 3, y + 5);
    y += 9;
  };

  // Key-value pair renderer in grid
  const renderField = (label: string, value: string, x: number, fieldWidth: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // slate-900
    const lines = doc.splitTextToSize(value || 'N/A', fieldWidth);
    doc.text(lines, x, y + 4.5);
    return lines.length * 4 + 4;
  };

  // Initial full header
  renderHeader();

  // 1. PARTICIPANT DEMOGRAPHICS
  renderSectionHeader('Participant Identification & Demographics', '1');
  ensureSpace(24);
  const col1 = margin + 3;
  const col2 = margin + 55;
  const col3 = margin + 115;

  renderField('FULL LEGAL NAME', participant.fullName, col1, 50);
  renderField('PREFERRED NAME', participant.preferredName || participant.fullName.split(' ')[0], col2, 55);
  renderField('NDIS PARTICIPANT NUMBER', participant.ndisNumber, col3, 50);
  y += 12;

  renderField('DATE OF BIRTH', `${participant.dateOfBirth} (${calculateAge(participant.dateOfBirth)})`, col1, 50);
  renderField('GENDER', participant.gender, col2, 55);
  renderField('RESIDENTIAL ADDRESS', `${participant.suburb}, ${participant.state} ${participant.postcode}`, col3, 50);
  y += 14;

  // 2. GEOGRAPHIC CLASSIFICATION & PRICING
  renderSectionHeader('Geographical Classification & Modified Monash Model (MMM)', '2');
  ensureSpace(22);
  const mmmDescriptions: Record<number, string> = {
    1: 'MMM 1 - Metropolitan Melbourne/Sydney (National Base Rates)',
    2: 'MMM 2 - Regional Centre (National Base Rates)',
    3: 'MMM 3 - Large Rural Town (National Base Rates)',
    4: 'MMM 4 - Medium Rural Town (National Base Rates)',
    5: 'MMM 5 - Small Rural Town (National Base Rates)',
    6: 'MMM 6 - Remote Community (+40% Pricing Schedule PAPL Loading Permitted)',
    7: 'MMM 7 - Very Remote Community (+50% Pricing Schedule PAPL Loading Permitted)',
  };

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 14, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 14, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Monash Classification: ${mmmDescriptions[participant.mmmZone] || `Zone ${participant.mmmZone}`}`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Compliant with NDIA Pricing Arrangements and Price Limits (PAPL 2025/26). Registered Branch: ${participant.state}.`, margin + 4, y + 11);
  y += 18;

  // 3. CLINICAL PRESENTATION & DIAGNOSES
  renderSectionHeader('Clinical Presentation & Primary / Secondary Diagnoses', '3');
  ensureSpace(28);

  doc.setFillColor(240, 253, 244); // emerald-50
  doc.rect(margin, y, contentWidth, 12, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.rect(margin, y, contentWidth, 12, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text('PRIMARY DIAGNOSIS:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const diagLines = doc.splitTextToSize(participant.primaryDiagnosis, contentWidth - 40);
  doc.text(diagLines, margin + 36, y + 5);
  y += 14;

  if (participant.secondaryDiagnoses && participant.secondaryDiagnoses.length > 0) {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('SECONDARY COMORBIDITIES & CO-OCCURRING IMPAIRMENTS:', margin + 2, y + 3);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    participant.secondaryDiagnoses.forEach(diag => {
      ensureSpace(6);
      doc.text(`•  ${diag}`, margin + 5, y + 3);
      y += 5;
    });
    y += 2;
  }

  // 4. BUDGET GOVERNANCE & NDIS PLAN STATUS
  renderSectionHeader('NDIS Plan Financial Allocation & Governance', '4');
  ensureSpace(32);

  const burnPercent = Math.round((participant.consumedBudget / participant.totalAllocatedBudget) * 100);
  const remainingBudget = participant.totalAllocatedBudget - participant.consumedBudget;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 24, 'S');

  renderField('PLAN START DATE', new Date(participant.planStartDate).toLocaleDateString('en-AU'), col1, 45);
  renderField('PLAN END DATE', new Date(participant.planEndDate).toLocaleDateString('en-AU'), col2, 45);
  renderField('BUDGET UTILISATION', `${burnPercent}% (${participant.consumedBudget > participant.totalAllocatedBudget ? 'OVER BUDGET' : 'On Track'})`, col3, 50);
  y += 11;

  renderField('TOTAL ALLOCATED BUDGET', `$${participant.totalAllocatedBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`, col1, 45);
  renderField('CONSUMED / CLAIMED', `$${participant.consumedBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`, col2, 45);
  renderField('REMAINING BALANCE', `$${remainingBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`, col3, 50);
  y += 17;

  // 5. BEHAVIOUR SUPPORT PLAN & RESTRICTIVE PRACTICES
  renderSectionHeader('Positive Behaviour Support Plan (BSP) & Restrictive Practices', '5');
  ensureSpace(34);

  renderField('BSP LODGEMENT STATUS', participant.activeBSP ? 'LODGED & CURRENT WITH NDIS COMMISSION' : 'NO ACTIVE BSP LODGED', col1, 55);
  renderField('BSP MANDATORY REVIEW DUE', participant.bspReviewDueDate ? new Date(participant.bspReviewDueDate).toLocaleDateString('en-AU') : 'NOT APPLICABLE', col2, 55);
  renderField('ACTIVE RESTRICTIVE PRACTICES', `${participant.activeRestrictivePracticesCount} Protocol(s) Authorised`, col3, 50);
  y += 12;

  renderField('BEHAVIOUR SUPPORT PRACTITIONER', participant.behaviourSupportPractitioner, col1, 80);
  renderField('ALLIED HEALTH KEY WORKER', participant.alliedHealthKeyWorker, margin + 95, 80);
  y += 14;

  // Linked Restrictive Practice Protocols (if any)
  const linkedProtocols = (options.protocols || []).filter(proto => proto.participantId === participant.id);
  if (linkedProtocols.length > 0) {
    ensureSpace(20);
    doc.setFillColor(254, 242, 242); // rose-50
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(190, 18, 60); // rose-700
    doc.text('AUTHORISED RESTRICTIVE PRACTICE PROTOCOLS REGISTERED IN AUDIT RECORD:', margin + 3, y + 4.5);
    y += 8;

    linkedProtocols.forEach((proto, idx) => {
      ensureSpace(20);
      doc.setDrawColor(254, 205, 211);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + 2, y, contentWidth - 4, 18, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. Type: ${proto.type.toUpperCase()} | Status: ${proto.authorisationStatus.toUpperCase()}`, margin + 5, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const desc = doc.splitTextToSize(`Description: ${proto.description}`, contentWidth - 14);
      doc.text(desc, margin + 5, y + 9);

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Authorising Body: ${proto.authorisingBody} | Expiry: ${proto.expiryDate} | Review: ${proto.reviewDate}`, margin + 5, y + 15);
      y += 21;
    });
  }

  // 6. NDIS GOALS & CAPACITY OUTCOMES
  if (participant.goals && participant.goals.length > 0) {
    renderSectionHeader('Participant NDIS Goals & Capacity Building Milestones', '6');
    ensureSpace(20);

    participant.goals.forEach((goal, gIdx) => {
      ensureSpace(18);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin + 2, y, contentWidth - 4, 16, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Goal ${gIdx + 1}: ${goal.title}`, margin + 5, y + 4.5);

      // Status pill text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (goal.status === 'achieved') {
        doc.setTextColor(16, 185, 129);
      } else if (goal.status === 'in_progress') {
        doc.setTextColor(37, 99, 235);
      } else {
        doc.setTextColor(100, 116, 139);
      }
      doc.text(`[STATUS: ${goal.status.toUpperCase()}] | CATEGORY: ${goal.category.toUpperCase()} | TARGET: ${goal.targetDate}`, pageWidth - margin - 90, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const desc = doc.splitTextToSize(goal.description, contentWidth - 14);
      doc.text(desc, margin + 5, y + 9.5);

      y += 19;
    });
  }

  // 7. CARE CIRCLE & NOMINEE CONTACTS
  renderSectionHeader('Care Circle & Emergency Nominee Contacts', '7');
  ensureSpace(18);

  renderField('EMERGENCY CONTACT / NOMINEE', participant.contactEmergencyName, col1, 60);
  renderField('CONTACT PHONE NUMBER', participant.contactEmergencyPhone, col2, 50);
  renderField('ALLIED HEALTH SPECIALIST', participant.alliedHealthKeyWorker, col3, 50);
  y += 16;

  // 8. AUDIT DECLARATION & SIGN-OFF
  ensureSpace(40);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 34, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('NDIS QUALITY AND SAFEGUARDS COMMISSION COMPLIANCE DECLARATION', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const declarationText = 'I certify that this record accurately reflects the clinical management, behaviour support plan, authorised restrictive practice protocols, and NDIS support allocation as maintained in accordance with the National Disability Insurance Scheme Act 2013 and NDIS (Restrictive Practices and Behaviour Support) Rules 2018.';
  doc.text(doc.splitTextToSize(declarationText, contentWidth - 8), margin + 4, y + 10);

  // Sign-off line
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 4, y + 26, margin + 65, y + 26);
  doc.line(margin + 75, y + 26, margin + 125, y + 26);
  doc.line(margin + 135, y + 26, margin + 175, y + 26);

  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(options.auditorName || 'Lead Clinician / Audit Supervisor', margin + 4, y + 30);
  doc.text('Signature / Digital Verification', margin + 75, y + 30);
  doc.text(`Audit Date: ${new Date().toISOString().slice(0, 10)}`, margin + 135, y + 30);

  y += 38;

  // Render footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Breakthrough Support Services | NDIS Quality & Safeguards Audit Record | Document Confidentiality Level: PROTECTED`,
      margin,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 6);
  }

  return doc;
}

/**
 * Generates Caseload Audit Summary PDF for all participants
 */
export function generateCaseloadAuditPdf(participants: Participant[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('BREAKTHROUGH SUPPORT SERVICES - NDIS CASELOAD COMPLIANCE AUDIT SUMMARY', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Total Caseload: ${participants.length} Participants | Generated: ${new Date().toLocaleString('en-AU')} | NDIS Quality & Safeguards Audit Standard`, margin + 4, y + 14);

  y += 24;

  // Table Headers
  const colX = {
    name: margin + 2,
    ndis: margin + 50,
    mmm: margin + 76,
    suburb: margin + 96,
    diagnosis: margin + 130,
    budget: margin + 195,
    burn: margin + 225,
    bsp: margin + 245,
  };

  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PARTICIPANT NAME', colX.name, y + 5);
  doc.text('NDIS NO', colX.ndis, y + 5);
  doc.text('ZONE', colX.mmm, y + 5);
  doc.text('LOCATION', colX.suburb, y + 5);
  doc.text('PRIMARY DIAGNOSIS', colX.diagnosis, y + 5);
  doc.text('ALLOCATED', colX.budget, y + 5);
  doc.text('BURN %', colX.burn, y + 5);
  doc.text('BSP / RP', colX.bsp, y + 5);

  y += 9;

  participants.forEach((p, idx) => {
    if (y > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
      // Re-render table header
      doc.setFillColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('PARTICIPANT NAME', colX.name, y + 5);
      doc.text('NDIS NO', colX.ndis, y + 5);
      doc.text('ZONE', colX.mmm, y + 5);
      doc.text('LOCATION', colX.suburb, y + 5);
      doc.text('PRIMARY DIAGNOSIS', colX.diagnosis, y + 5);
      doc.text('ALLOCATED', colX.budget, y + 5);
      doc.text('BURN %', colX.burn, y + 5);
      doc.text('BSP / RP', colX.bsp, y + 5);
      y += 9;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 2, contentWidth, 6, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(p.fullName.slice(0, 28), colX.name, y + 2);
    doc.text(p.ndisNumber, colX.ndis, y + 2);
    doc.text(`MMM ${p.mmmZone}`, colX.mmm, y + 2);
    doc.text(`${p.suburb}, ${p.state}`, colX.suburb, y + 2);
    doc.text(p.primaryDiagnosis.slice(0, 36), colX.diagnosis, y + 2);
    doc.text(`$${p.totalAllocatedBudget.toLocaleString('en-AU')}`, colX.budget, y + 2);
    
    const burn = Math.round((p.consumedBudget / p.totalAllocatedBudget) * 100);
    doc.text(`${burn}%`, colX.burn, y + 2);
    doc.text(`${p.activeBSP ? 'BSP' : 'No BSP'} | ${p.activeRestrictivePracticesCount} RP`, colX.bsp, y + 2);

    y += 6.5;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Breakthrough Support Services | NDIS Caseload Compliance Summary | Protected`, margin, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 5);
  }

  return doc;
}

/**
 * Downloads participant PDF file directly to browser
 */
export function downloadParticipantPdf(participant: Participant, options?: AuditPdfOptions): void {
  const doc = generateParticipantAuditPdf(participant, options);
  const cleanName = participant.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `NDIS_Audit_CarePlan_${cleanName}_${participant.ndisNumber}.pdf`;
  doc.save(filename);
}

/**
 * Downloads full caseload audit PDF
 */
export function downloadCaseloadPdf(participants: Participant[]): void {
  const doc = generateCaseloadAuditPdf(participants);
  const filename = `NDIS_Caseload_Audit_Summary_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Safe print helper: Opens a formatted, printable window/view for printing
 */
export function printParticipantCarePlan(participant: Participant, protocols: RestrictivePracticeProtocol[] = []): void {
  const linkedProtocols = protocols.filter(proto => proto.participantId === participant.id);
  const burnPercent = Math.round((participant.consumedBudget / participant.totalAllocatedBudget) * 100);

  const printContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>NDIS Audit Care Plan - ${participant.fullName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 20px; font-size: 12px; }
        .header { background: #0f172a; color: #fff; padding: 16px; border-radius: 6px; margin-bottom: 20px; }
        .header h1 { margin: 0 0 4px 0; font-size: 16px; }
        .header p { margin: 2px 0; font-size: 11px; color: #94a3b8; }
        .section { margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
        .section-title { background: #f1f5f9; padding: 8px 12px; font-weight: bold; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
        .section-body { padding: 12px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .field-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
        .field-value { font-size: 12px; color: #0f172a; margin-top: 2px; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-green { background: #dcfce7; color: #15803d; }
        .badge-amber { background: #fef3c7; color: #b45309; }
        .badge-blue { background: #dbeafe; color: #1d4ed8; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #f8fafc; font-weight: bold; }
        .declaration { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-top: 20px; }
        .signature-box { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 10px; }
        .sign-line { border-top: 1px solid #94a3b8; width: 30%; text-align: center; font-size: 10px; color: #64748b; padding-top: 4px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BREAKTHROUGH SUPPORT SERVICES - NDIS AUDIT RECORD</h1>
        <p>NDIS Registered Provider #4050019283 | Quality & Safeguards Commission Compliance</p>
        <p>Participant Profile & Behaviour Support Care Plan | Printed: ${new Date().toLocaleString('en-AU')}</p>
      </div>

      <div class="section">
        <div class="section-title">1. PARTICIPANT DEMOGRAPHICS & IDENTIFICATION</div>
        <div class="section-body grid">
          <div><div class="field-label">Full Legal Name</div><div class="field-value">${participant.fullName}</div></div>
          <div><div class="field-label">Preferred Name</div><div class="field-value">${participant.preferredName || participant.fullName}</div></div>
          <div><div class="field-label">NDIS Participant Number</div><div class="field-value font-mono">${participant.ndisNumber}</div></div>
          <div><div class="field-label">Date of Birth</div><div class="field-value">${participant.dateOfBirth} (${calculateAge(participant.dateOfBirth)})</div></div>
          <div><div class="field-label">Gender</div><div class="field-value">${participant.gender}</div></div>
          <div><div class="field-label">Address</div><div class="field-value">${participant.suburb}, ${participant.state} ${participant.postcode}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">2. GEOGRAPHIC CLASSIFICATION (MODIFIED MONASH MODEL)</div>
        <div class="section-body">
          <strong>Zone: MMM ${participant.mmmZone}</strong> - ${
            participant.mmmZone === 6 ? 'Remote Community (+40% PAPL Loading)' :
            participant.mmmZone === 7 ? 'Very Remote Community (+50% PAPL Loading)' :
            'National Base Rates'
          }
        </div>
      </div>

      <div class="section">
        <div class="section-title">3. CLINICAL DIAGNOSES & PRESENTATION</div>
        <div class="section-body">
          <p><strong>Primary Diagnosis:</strong> ${participant.primaryDiagnosis}</p>
          ${participant.secondaryDiagnoses && participant.secondaryDiagnoses.length > 0 ? `
            <p><strong>Secondary Diagnoses / Comorbidities:</strong> ${participant.secondaryDiagnoses.join(', ')}</p>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">4. NDIS PLAN BUDGET STATUS</div>
        <div class="section-body grid">
          <div><div class="field-label">Plan Validity</div><div class="field-value">${new Date(participant.planStartDate).toLocaleDateString('en-AU')} to ${new Date(participant.planEndDate).toLocaleDateString('en-AU')}</div></div>
          <div><div class="field-label">Total Allocated</div><div class="field-value">$${participant.totalAllocatedBudget.toLocaleString('en-AU')}</div></div>
          <div><div class="field-label">Consumed Budget</div><div class="field-value">$${participant.consumedBudget.toLocaleString('en-AU')} (${burnPercent}%)</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">5. BEHAVIOUR SUPPORT & RESTRICTIVE PRACTICES</div>
        <div class="section-body grid">
          <div><div class="field-label">PBS Practitioner</div><div class="field-value">${participant.behaviourSupportPractitioner}</div></div>
          <div><div class="field-label">BSP Status</div><div class="field-value">${participant.activeBSP ? 'Lodged & Active' : 'No Active BSP'}</div></div>
          <div><div class="field-label">Authorised Restraints</div><div class="field-value">${participant.activeRestrictivePracticesCount} Active Protocol(s)</div></div>
        </div>
        ${linkedProtocols.length > 0 ? `
          <div style="padding: 0 12px 12px 12px;">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Authorising Body</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                ${linkedProtocols.map(proto => `
                  <tr>
                    <td><strong>${proto.type.toUpperCase()}</strong></td>
                    <td>${proto.description}</td>
                    <td>${proto.authorisingBody}</td>
                    <td>${proto.expiryDate}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>

      ${participant.goals && participant.goals.length > 0 ? `
        <div class="section">
          <div class="section-title">6. NDIS PARTICIPANT GOALS & TARGETS</div>
          <div class="section-body">
            <table>
              <thead>
                <tr>
                  <th>Goal Title</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Target Date</th>
                </tr>
              </thead>
              <tbody>
                ${participant.goals.map(g => `
                  <tr>
                    <td><strong>${g.title}</strong></td>
                    <td>${g.description}</td>
                    <td>${g.category.replace('_', ' ').toUpperCase()}</td>
                    <td><span class="badge ${g.status === 'achieved' ? 'badge-green' : 'badge-blue'}">${g.status.toUpperCase()}</span></td>
                    <td>${g.targetDate}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">7. CARE CIRCLE & CONTACTS</div>
        <div class="section-body grid">
          <div><div class="field-label">Emergency Nominee</div><div class="field-value">${participant.contactEmergencyName}</div></div>
          <div><div class="field-label">Nominee Phone</div><div class="field-value">${participant.contactEmergencyPhone}</div></div>
          <div><div class="field-label">Allied Health Key Worker</div><div class="field-value">${participant.alliedHealthKeyWorker}</div></div>
        </div>
      </div>

      <div class="declaration">
        <strong>NDIS QUALITY AND SAFEGUARDS COMMISSION COMPLIANCE DECLARATION</strong>
        <p style="font-size: 10px; color: #64748b; margin: 4px 0 0 0;">
          This record is certified as an accurate clinical excerpt conforming to the National Disability Insurance Scheme Act 2013 and NDIS (Restrictive Practices and Behaviour Support) Rules 2018.
        </p>
        <div class="signature-box">
          <div class="sign-line">Lead Clinician / Auditor Signature</div>
          <div class="sign-line">Practitioner Registration ID</div>
          <div class="sign-line">Date: ${new Date().toISOString().slice(0, 10)}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Use a hidden iframe to trigger print without disrupting the current page
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(printContent);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 400);
  }
}
