/**
 * Shared MAR-KB-001 helpers for Vercel serverless functions.
 * Mirrors the logic in server.ts so /api/* works on Vercel
 * (where the Express server in server.ts does NOT run).
 */
import {
  MARITIME_SECTIONS,
  MARITIME_GLOSSARY,
  KNOWLEDGE_BASE_META,
} from '../src/data/maritimeKnowledge';

export function buildKnowledgeContext(): string {
  return `
DOCUMENT METADATA:
- ID: ${KNOWLEDGE_BASE_META.documentId}
- Version: ${KNOWLEDGE_BASE_META.version} (Reference: ${KNOWLEDGE_BASE_META.referenceDate})
- Title: ${KNOWLEDGE_BASE_META.title}
- Governance: ${KNOWLEDGE_BASE_META.governance}

CORE AI ANSWER CONTRACT (from Section 24):
1. Answer the direct question first, then state the applicability boundary and official source citation (e.g. [MAR-KB-001 §04], [SOLAS Ch V], [MARPOL Annex I], [STCW Table A-II/1]).
2. Explicitly label items using the 5 priority labels:
   - [STATUTORY / REQUIRED]: Mandatory obligation confirmed in current official IMO/ILO/Flag rules.
   - [VESSEL-SPECIFIC]: Depends on ship type, class notation, equipment fitted, or company SMS.
   - [CONDITIONAL]: Applies in defined cases (e.g., tankers, polar code, hazardous cargo, certain tonnage).
   - [RECOMMENDED]: Industry best practice, seamanship advice, or working procedure.
   - [VERIFY]: Applicability or current status not confirmed; must check official manual or flag circular.
3. Identify missing context instead of silently guessing vessel type, flag, rank, cargo, or operating area.
4. For safety-critical questions (e.g. enclosed space entry, steering failure, fire, blackout, heavy weather, cargo liquefaction, mooring snap-back), ALWAYS emphasize:
   - Life-safety controls: never enter enclosed spaces on a single reading; rescue teams must have SCBA and not create secondary casualties.
   - Cross-check rule: electronic aids (ECDIS, AIS, GNSS) have limitations and never replace competent watchkeeping.
   - Always refer to the vessel's approved SMS, Master's standing orders, and responsible duty officer.
5. If discussing Philippines seafarers (MARINA):
   - Reference MARINA STCW Administration Office portals (https://stcw.marina.gov.ph/faq-documentary-requirements/ and circulars).
   - Emphasize checking current circulars and MISMO portal requirements.

SECTIONS SUMMARY:
${MARITIME_SECTIONS.map((s) => `§${s.number} ${s.title}: ${s.summary}`).join('\n')}
`;
}

export function buildSystemInstruction(): string {
  return `You are MarinerAI, an expert maritime operations assistant tailored for mariners, seafarers, deck officers, captains, and marine engineers.
You are strictly grounded on the official "MARITIME OPERATIONS AI KNOWLEDGE BASE" (MAR-KB-001, Version 1.0, 14 October 2026).

Tone and style:
- Authoritative, professional, concise, and nautical yet accessible to all shipboard ranks.
- Clean formatting with markdown: bold headings, structured bullet points, and high-visibility priority tags.
- Follow the Recommended AI Answer Contract from Section 24.
- Include safety boundaries, relevant calculations, and checklists where appropriate.
- When an image or audio is provided, thoroughly analyze nautical visual details (e.g., rust, draft marks, gauges, safety labels, rigging) or audio messages with nautical expertise.

${buildKnowledgeContext()}
`;
}

/** Local resilient maritime knowledge retriever based on MAR-KB-001 (offline fallback). */
export function generateLocalMaritimeResponse(
  message: string,
  role: string,
  attachments: any[],
): string {
  const query = (message || '').toLowerCase();

  const matchedAcronyms = MARITIME_GLOSSARY.filter((g) =>
    new RegExp(`\\b${g.abbreviation.toLowerCase()}\\b`, 'i').test(query),
  );

  const scoredSections = MARITIME_SECTIONS.map((sec) => {
    let score = 0;
    if (query.includes(sec.title.toLowerCase())) score += 10;
    if (query.includes(`§${sec.number}`) || query.includes(`section ${sec.number}`)) score += 15;
    for (const tag of sec.tags) {
      if (query.includes(tag.toLowerCase())) score += 5;
    }
    const words = query.split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) {
      if (sec.summary.toLowerCase().includes(w)) score += 2;
      if (sec.content?.toLowerCase().includes(w)) score += 1;
      if (sec.items?.some((it) => it.toLowerCase().includes(w))) score += 2;
    }
    return { sec, score };
  }).sort((a, b) => b.score - a.score);

  const top = scoredSections[0]?.score > 0 ? scoredSections[0].sec : MARITIME_SECTIONS[0];

  if (query.includes('enclosed space') || query.includes('atmosphere test') || query.includes('gas detector')) {
    return `**Direct Operational Answer:**
Before entering any enclosed space, mandatory testing of the atmosphere must be conducted using a calibrated multi-gas detector.

**Atmosphere Safety Limits [STATUTORY / REQUIRED]:**
• **Oxygen (O2):** Exactly **20.9%** by volume (acceptable range 20.8% - 21.0%).
• **Flammable Hydrocarbon Vapours (LEL):** Less than **1% LEL**.
• **Carbon Monoxide (CO):** Less than **25 ppm** (TLV-TWA).
• **Hydrogen Sulphide (H2S):** Less than **5 ppm** (TLV-TWA).

**Mandatory Life-Safety Controls [STATUTORY / REQUIRED]:**
1. **Never enter an enclosed space based only on a reading from one unverified instrument.** Test at multiple depths and corners.
2. Complete and sign the **Enclosed Space Entry Permit [STATUTORY / REQUIRED]** with designated Responsible Officer approval.
3. Continuous mechanical ventilation must run throughout the entry.
4. Station a trained, dedicated standby watchkeeper at the hatchway with verified two-way communications.
5. Rescue harness, lifelines, resuscitation oxygen, and SCBA must be on station at the entrance.

⚠️ **LIFE-SAFETY CONTROL [MAR-KB-001 §09 / §17]:** Rescue attempts without proper breathing apparatus must never be undertaken. Rescue attempts must not create additional casualties.

*Citations:* [MAR-KB-001 §09 / §17], [SOLAS Ch III / Ch XI-1/7].`;
  }

  if (query.includes('marpol') || query.includes('bilge') || query.includes('ows') || query.includes('garbage')) {
    return `**Direct Operational Answer:**
Under MARPOL Annex I (Oil Pollution) and Annex V (Garbage), all discharges into the sea are strictly governed with mandatory log entries.

**Oily Bilge Water Discharge Requirements [STATUTORY / REQUIRED]:**
• The ship must be **en route** outside special areas.
• The oily mixture must be processed through an approved **15 ppm Oily Water Separator (OWS)**.
• The 15 ppm bilge alarm and automatic stopping device must be fully operational and fail-safe.
• Oil content of the effluent without dilution must not exceed **15 parts per million (ppm)**.
• **Oil Record Book (ORB) Part I [STATUTORY / REQUIRED]:** Immediate entry under Code (D) for automatic or (E) for manual bilge discharge with start/stop times and geographical coordinates.

**Garbage Management & Discharge Zones [STATUTORY / REQUIRED]:**
• **Plastics (Category A):** ZERO discharge anywhere at sea under any circumstances.
• **Food Waste (Category B):** Discharge permitted en route:
  - More than **12 nautical miles** from nearest land if uncomminuted.
  - More than **3 nautical miles** if comminuted/ground to pass through a screen < 25 mm.
• **Garbage Record Book (GRB) [STATUTORY / REQUIRED]:** Every discharge at sea or disposal to port reception facility must be recorded and signed.

*Citations:* [MAR-KB-001 §14 Environmental Protection & Pollution Records], [MARPOL Annex I & V].`;
  }

  if (query.includes('meal plan') || query.includes('food plan') || query.includes('daily food') || query.includes('provision') || query.includes('catering') || query.includes('menu') || query.includes('victualing')) {
    const paxMatch = query.match(/(\d+)\s*(persons|pax|crew|people|men|members)/i) || query.match(/for\s*(\d+)/i);
    const daysMatch = query.match(/(\d+)\s*(days|day)/i);
    const pax = paxMatch ? parseInt(paxMatch[1]) : 20;
    const numDays = daysMatch ? parseInt(daysMatch[1]) : 7;
    const manDays = pax * numDays;
    const dailyRate = 11.5;
    const totalBudget = (manDays * dailyRate).toFixed(2);

    return `**MLC 2006 Regulation 3.2 Food & Catering Plan (${pax} Persons · ${numDays} Days):**
[STATUTORY / REQUIRED]: Under MLC 2006 Standard A3.2, all seafarers must be provided with balanced, nutritious meals free of charge, respecting cultural, religious, and national dietary requirements.

**Voyage Victualing Parameters:**
• **Crew Complement:** ${pax} persons
• **Duration:** ${numDays} days (${manDays} total man-days)
• **Allocated Victualing Rate:** $${dailyRate.toFixed(2)} USD / person / day
• **Estimated Total Stores Budget:** **$${totalBudget} USD**

*Citations:* [MAR-KB-001 §11 Conventions (MLC 2006)], [MAR-KB-001 §22 Role Reference (Cook/Steward)].
💡 *Tip: Open the **Food Planner** in the top navigation or tools menu to customize parameters and export to Excel (.csv) or Print / PDF!*`;
  }

  if (query.includes('marina') || (query.includes('philippine') && query.includes('stcw')) || (query.includes('filipino') && (query.includes('seafarer') || query.includes('cert') || query.includes('coc') || query.includes('cop')))) {
    return `**Direct Operational Answer for Filipino Seafarers (MARINA):**
For all certification, revalidation, and documentary requirements under STCW 1978 as amended, Filipino seafarers must adhere to the current circulars issued by the **MARINA STCW Administration Office**.

**Official Verification Portals [STATUTORY / REQUIRED]:**
• **MARINA STCW Requirements:** https://stcw.marina.gov.ph/faq-documentary-requirements/
• **MARINA STCW Circulars:** https://stcw.marina.gov.ph/marina-stcw-circulars/
• **MISMO Online System:** Applications for Certificate of Competency (CoC) and Certificate of Proficiency (CoP) must be lodged via the official MISMO portal.

*Notice [MAR-KB-001 §12]:* Historical circulars or proposed draft rules must not be treated as effective requirements without confirming their current in-force status on the official MARINA website.`;
  }

  let res = `**Direct Operational Answer [MAR-KB-001 §${top.number} ${top.title}]:**\n`;
  res += `${top.summary}\n\n`;

  res += `**Core Standards & Requirements [STATUTORY / REQUIRED]:**\n`;
  if (top.items && top.items.length > 0) {
    top.items.slice(0, 5).forEach((it) => {
      res += `• ${it}\n`;
    });
  } else if (top.content) {
    res += `${top.content}\n`;
  }

  if (top.tableData && top.tableData.length > 0) {
    res += `\n**Key Operational Matrix [MAR-KB-001 §${top.number}]:**\n`;
    top.tableData.slice(0, 4).forEach((row) => {
      const keys = Object.keys(row);
      res += `• **${row[keys[0]]}:** ${row[keys[1]]}\n`;
    });
  }

  if (top.keyRules && top.keyRules.length > 0) {
    res += `\n**Safety Boundaries & Operational Limits:**\n`;
    top.keyRules.forEach((r) => {
      res += `⚠️ **${r}**\n`;
    });
  }

  if (matchedAcronyms.length > 0) {
    res += `\n**Relevant Maritime Terminology [MAR-KB-001 §25]:**\n`;
    matchedAcronyms.slice(0, 3).forEach((g) => {
      res += `• **${g.abbreviation}:** ${g.meaning}\n`;
    });
  }

  res += `\n*Source:* [MAR-KB-001 §${top.number} ${top.title}]. This knowledge base reference does not replace the vessel's approved Safety Management System (SMS), approved manuals, or master's command authority.`;

  return res;
}

/** Safely parse a request body that may already be an object or a JSON string. */
export function parseBody(body: any): any {
  if (!body) return {};
  if (typeof body === 'object') return body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
}

/** Convert any thrown / returned error value into a readable string (never "[object Object]"). */
export function errorToString(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || 'Unknown error';
  const anyErr = err as any;
  if (typeof anyErr?.message === 'string' && anyErr.message) return anyErr.message;
  if (typeof anyErr?.error === 'string' && anyErr.error) return anyErr.error;
  try {
    const s = JSON.stringify(err);
    return s && s !== '{}' ? s : String(err);
  } catch {
    return String(err);
  }
}
