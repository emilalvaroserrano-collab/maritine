import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { MARITIME_SECTIONS, MARITIME_GLOSSARY, KNOWLEDGE_BASE_META } from './src/data/maritimeKnowledge.ts';
import { CHAT_MODELS, CHAT_META_MODEL, TTS_MODELS, TTS_VOICE, supportsThinking } from './src/config/aiModels.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Server-side initialization of Gemini API using recommended SDK guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Construct the system instruction grounded on MAR-KB-001
const KNOWLEDGE_CONTEXT = `
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
${MARITIME_SECTIONS.map(s => `§${s.number} ${s.title}: ${s.summary}`).join('\n')}
`;

const BASE_SYSTEM_INSTRUCTION = `You are MarinerAI, an expert maritime operations assistant tailored for mariners, seafarers, deck officers, captains, and marine engineers.
You are strictly grounded on the official "MARITIME OPERATIONS AI KNOWLEDGE BASE" (MAR-KB-001, Version 1.0, 14 October 2026).

Tone and style:
- Authoritative, professional, concise, and nautical yet accessible to all shipboard ranks.
- Clean formatting with markdown: bold headings, structured bullet points, and high-visibility priority tags.
- Follow the Recommended AI Answer Contract from Section 24.
- Include safety boundaries, relevant calculations, and checklists where appropriate.
- When an image or audio is provided, thoroughly analyze nautical visual details (e.g., rust, draft marks, gauges, safety labels, rigging) or audio messages with nautical expertise.

${KNOWLEDGE_CONTEXT}
`;

// Local resilient maritime knowledge retriever based on MAR-KB-001
function generateLocalMaritimeResponse(message: string, role: string, attachments: any[]): string {
  const query = (message || '').toLowerCase();

  // Check glossary matches first
  const matchedAcronyms = MARITIME_GLOSSARY.filter((g) =>
    new RegExp(`\\b${g.abbreviation.toLowerCase()}\\b`, 'i').test(query)
  );

  // Score sections based on keywords
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

  // Specific responses for high-frequency queries
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
    const dailyRate = 11.50;
    const totalBudget = (manDays * dailyRate).toFixed(2);

    return `**MLC 2006 Regulation 3.2 Food & Catering Plan (${pax} Persons · ${numDays} Days):**
[STATUTORY / REQUIRED]: Under MLC 2006 Standard A3.2, all seafarers must be provided with balanced, nutritious meals free of charge, respecting cultural, religious, and national dietary requirements.

**Voyage Victualing Parameters:**
• **Crew Complement:** ${pax} persons
• **Duration:** ${numDays} days (${manDays} total man-days)
• **Demographics:** Multinational (Filipino, Indian / Halal, European / Slavic)
• **Allocated Victualing Rate:** $${dailyRate.toFixed(2)} USD / person / day
• **Estimated Total Stores Budget:** **$${totalBudget} USD**

---

### **Daily Meal Schedule (Sample Rotation):**

**Day 1:**
• **Breakfast (06:00 - 08:30):**
  - Filipino/Asian: Garlic Fried Rice (Sinangag), Corned Beef / Tocino, Fried Eggs
  - Western/Continental: Toast, Croissants, Omelet to order, Bacon / Chicken Sausage, Baked Beans
  - Beverages: Fresh Milk, Tea, Brewed Coffee, Orange Juice
• **Lunch (11:30 - 13:00):**
  - Soup: Chicken & Sweetcorn Soup
  - Asian/Ethnic Option: Filipino Chicken Adobo with steamed Jasmine Rice
  - Western/Main Option: Roast Beef with Brown Gravy, Roasted Potatoes & Glazed Carrots
  - Vegetables: Sautéed Mixed Greens / Chop Suey
  - Dessert: Fresh Fruit Platter (Watermelon, Bananas, Apples)
• **Dinner (17:00 - 18:30):**
  - Asian/Ethnic Option: Fish Curry (Halal) with Steamed Basmati Rice & Dal
  - Western/Main Option: Pan-seared Pork Chops or Grilled Chicken Breast with Mashed Potatoes
  - Accompaniments: Garden Salad & Buttered Sweetcorn
  - Dessert: Caramel Custard / Ice Cream
• **Midnight Watchkeeper Snack (23:30 - 04:00):**
  - Pancit Canton stir-fried noodles, hard-boiled eggs, sandwich spread, hot tea & coffee

**Day 2:**
• **Breakfast:** French Toast / Pancakes, Fried Eggs, Breakfast Sausages, Hash Browns, Oatmeal Porridge
• **Lunch:**
  - Soup: Sinigang na Baboy (Pork Tamarind Broth) or Clear Vegetable Broth
  - Asian Option: Beef Bistek Tagalog with Jasmine Rice
  - Western Option: Baked Cod Fillet in Lemon Butter Sauce with French Fries
  - Veg & Dessert: Steamed Broccoli & Buko Pandan
• **Dinner:**
  - Asian Option: Chicken Tikka Masala with Naan / Roti & Yellow Dal
  - Western Option: Spaghetti Bolognese with Garlic Baguette
  - Dessert: Mango Pudding & Fresh Oranges
• **Midnight Snack:** Warm Congee (Arroz Caldo) with fried garlic & calamansi, toast

---

### **Ship-Chandler Provisioning Budget Breakdown:**
| Category | Estimated Share | Estimated Cost (USD) |
| :--- | :--- | :--- |
| **Meats & Poultry** (Chicken, Beef, Pork cuts) | 38% | $${(Number(totalBudget) * 0.38).toFixed(2)} |
| **Fish & Seafood** (White fish, Mackerel, Shrimp) | 18% | $${(Number(totalBudget) * 0.18).toFixed(2)} |
| **Fresh Produce** (Potatoes, Onions, Cabbage, Fruits) | 18% | $${(Number(totalBudget) * 0.18).toFixed(2)} |
| **Grains & Staples** (Jasmine Rice, Flour, Pasta) | 12% | $${(Number(totalBudget) * 0.12).toFixed(2)} |
| **Dairy, Eggs & Dry Stores** (Milk, Butter, Spices, Coffee) | 14% | $${(Number(totalBudget) * 0.14).toFixed(2)} |
| **Total Provision Stores Budget** | **100%** | **$${totalBudget} USD** |

*Citations:* [MAR-KB-001 §11 Conventions (MLC 2006)], [MAR-KB-001 §22 Role Reference (Cook/Steward)].
💡 *Tip: Open the **Food Planner** in the top navigation or tools menu to customize parameters, view all days, and export directly to **Microsoft Excel (.csv)** or **Print / PDF**!*`;
  }

  if (query.includes('marina') || (query.includes('philippine') && query.includes('stcw')) || (query.includes('filipino') && (query.includes('seafarer') || query.includes('cert') || query.includes('coc') || query.includes('cop')))) {
    return `**Direct Operational Answer for Filipino Seafarers (MARINA):**
For all certification, revalidation, and documentary requirements under STCW 1978 as amended, Filipino seafarers must adhere to the current circulars issued by the **MARINA STCW Administration Office**.

**Official Verification Portals [STATUTORY / REQUIRED]:**
• **MARINA STCW Requirements:** https://stcw.marina.gov.ph/faq-documentary-requirements/
• **MARINA STCW Circulars:** https://stcw.marina.gov.ph/marina-stcw-circulars/
• **MISMO Online System:** Applications for Certificate of Competency (CoC) and Certificate of Proficiency (CoP) must be lodged via the official MISMO portal.

**Mandatory Document Bundle [STATUTORY / REQUIRED]:**
• Valid Seafarer's Identification and Record Book (SIRB) / Seafarer's Passport.
• DOH-accredited Medical Fitness Certificate (PEME) valid for sea service.
• Certificate of Sea Service / Sea Service Testimonials signed by Master & Chief Mate/Engineer with vessel official stamp.
• Approved training course certificates from MARINA-accredited Maritime Training Institutions (MTIs).

*Notice [MAR-KB-001 §12]:* Historical circulars or proposed draft rules must not be treated as effective requirements without confirming their current in-force status on the official MARINA website.`;
  }

  // General synthesized section response
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

// API: Chat endpoint (handles both with and without trailing slash)
app.post(['/api/chat', '/api/chat/'], async (req, res) => {
  try {
    const { message, role = 'all', history = [], attachments = [], audio } = req.body;

    if (!message && (!attachments || attachments.length === 0) && !audio) {
      return res.status(400).json({ error: 'Message or attachment is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.'
      });
    }

    // Role-specific focus augmentation
    let roleAugmentation = '';
    if (role && role !== 'all') {
      roleAugmentation = `\nActive User Rank/Perspective: Focus your response primarily for the "${role}" role per Section 02 and Section 22 role-based reference bundles.`;
    }

    // Build contents payload
    const parts: any[] = [];

    // Add audio if provided
    if (audio && audio.base64) {
      const cleanBase64 = audio.base64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: audio.mimeType || 'audio/webm',
          data: cleanBase64,
        },
      });
      parts.push({
        text: 'The user sent the above voice recording. Listen, transcribe their spoken request, and answer their maritime question thoroughly according to MAR-KB-001.',
      });
    }

    // Add file/image attachments
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.base64) {
          const cleanData = att.base64.replace(/^data:[^;]+;base64,/, '');
          if (att.type && att.type.startsWith('image/')) {
            parts.push({
              inlineData: {
                mimeType: att.type,
                data: cleanData,
              },
            });
            parts.push({
              text: `[Attached image: "${att.name || 'image'}"] Please inspect any maritime equipment, markings, documents, or conditions visible.`,
            });
          } else if (att.type === 'application/pdf' || att.type?.includes('text') || att.type?.includes('json')) {
            // Include document content notice
            parts.push({
              text: `[Attached document: "${att.name || 'document'}" (${att.type || 'file'})]`,
            });
          }
        }
      }
    }

    // Add user text message
    if (message) {
      parts.push({
        text: message,
      });
    }

    // Build previous conversation context if present
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6); // last 6 turns
      for (const turn of recentHistory) {
        if (turn.role === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: turn.content }],
          });
        } else if (turn.role === 'assistant' || turn.role === 'model') {
          contents.push({
            role: 'model',
            parts: [{ text: turn.content }],
          });
        }
      }
    }

    // Append current turn
    contents.push({
      role: 'user',
      parts,
    });

    let replyText = "";
    const modelsToTry = CHAT_MODELS;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Model timeout after 25s (${modelName})`)), 25000)
        );

        const modelConfig: any = {
          systemInstruction: BASE_SYSTEM_INSTRUCTION + roleAugmentation,
          temperature: 0.3,
        };

        if (supportsThinking(modelName)) {
          modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const callPromise = ai.models.generateContent({
          model: modelName,
          contents,
          config: modelConfig,
        });

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        replyText = response?.text || "";
        if (replyText) break;
      } catch (callErr: any) {
        lastError = callErr;
        console.warn(`Model ${modelName} call returned:`, callErr?.message || callErr);
      }
    }

    // Offline / Intermittent connectivity fallback per Section 20
    if (!replyText) {
      replyText = generateLocalMaritimeResponse(message || '', role, attachments);
    }

    res.json({
      text: replyText,
      meta: {
        model: CHAT_META_MODEL,
        reference: 'MAR-KB-001',
        source: 'Maritime Operations Knowledge Base',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error generating response:', err);
    res.status(500).json({
      error: err.message || 'An error occurred while processing the maritime query.',
    });
  }
});

// API: Knowledge base overview and glossary lookup
app.get(['/api/knowledge', '/api/knowledge/'], (_req, res) => {
  res.json({
    meta: KNOWLEDGE_BASE_META,
    sections: MARITIME_SECTIONS,
    glossary: MARITIME_GLOSSARY,
  });
});

// API: TTS endpoint (models + voice from src/config/aiModels.ts)
app.post(['/api/tts', '/api/tts/'], async (req, res) => {
  try {
    const { text, voiceName = TTS_VOICE } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    // Clean text for natural speech synthesis
    const cleanText = text
      .replace(/\[STATUTORY \/ REQUIRED\]/g, 'Statutory required: ')
      .replace(/\[VESSEL-SPECIFIC\]/g, 'Vessel specific: ')
      .replace(/\[CONDITIONAL\]/g, 'Conditional: ')
      .replace(/\[RECOMMENDED\]/g, 'Recommended: ')
      .replace(/\[VERIFY\]/g, 'Verify: ')
      .replace(/\[MAR-KB-001\s*§\d+[^\]]*\]/g, '')
      .replace(/[*_#`]/g, '')
      .trim()
      .slice(0, 1600);

    const promptText = `## Transcript:\n${cleanText}`;

    let base64Audio: string | undefined;
    for (const ttsModel of TTS_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: ttsModel,
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || TTS_VOICE },
              },
            },
          },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) break;
      } catch (ttsErr: any) {
        console.warn(`TTS model ${ttsModel} call returned:`, ttsErr?.message || ttsErr);
      }
    }

    if (!base64Audio) {
      throw new Error('TTS models did not return audio data.');
    }

    res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      base64: base64Audio,
      mimeType: 'audio/wav',
      voice: voiceName || TTS_VOICE,
    });
  } catch (err: any) {
    console.error('TTS endpoint error:', err);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// Catch-all for any unknown API route: always return JSON 404, NEVER index.html
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Setup Vite middleware in dev or serve dist in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.resolve(distDir, 'index.html');
  const hasDist = await import('fs').then(fs => fs.existsSync(distIndex)).catch(() => false);

  if (isProduction && hasDist) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚓ MarinerAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
