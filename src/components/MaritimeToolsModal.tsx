import React, { useState } from 'react';
import { MARITIME_GLOSSARY } from '../data/maritimeKnowledge.ts';
import {
  X,
  Calculator,
  Search,
  CheckSquare,
  AlertTriangle,
  Send,
  Copy,
  Check,
  Ship,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface MaritimeToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (text: string) => void;
}

export const MaritimeToolsModal: React.FC<MaritimeToolsModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'checklist' | 'glossary'>('calculator');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- UKC & SQUAT CALCULATOR STATE ---
  const [chartedDepth, setChartedDepth] = useState<number>(14.5);
  const [tideHeight, setTideHeight] = useState<number>(1.8);
  const [staticDraft, setStaticDraft] = useState<number>(12.2);
  const [shipSpeed, setShipSpeed] = useState<number>(10.0);
  const [blockCoeff, setBlockCoeff] = useState<number>(0.80);
  const [isConfinedChannel, setIsConfinedChannel] = useState<boolean>(false);

  // Calculations per MAR-KB-001 Section 16
  const totalWaterDepth = Number((chartedDepth + tideHeight).toFixed(2));
  const squatMultiplier = isConfinedChannel ? 2.0 : 1.0;
  const calculatedSquat = Number(
    ((squatMultiplier * blockCoeff * Math.pow(shipSpeed, 2)) / 100).toFixed(2)
  );
  const dynamicDraft = Number((staticDraft + calculatedSquat).toFixed(2));
  const netUKC = Number((totalWaterDepth - dynamicDraft).toFixed(2));
  const isUKCCritical = netUKC < 1.0;
  const isUKCDangerous = netUKC <= 0.3;

  // Preset vessel drafts
  const VESSEL_PRESETS = [
    { label: 'Feeder / Handy', draft: 9.5, speed: 11.0, cb: 0.75 },
    { label: 'Panamax Bulk', draft: 12.2, speed: 10.0, cb: 0.82 },
    { label: 'Capesize', draft: 16.5, speed: 9.0, cb: 0.85 },
    { label: 'VLCC Tanker', draft: 20.0, speed: 8.5, cb: 0.86 },
  ];

  // --- CHECKLIST STATE ---
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'bridge' | 'engine' | 'deck' | 'safety' | 'crew'>('all');
  const initialChecks: Record<string, boolean> = {
    'c1': true, 'c2': true, 'c3': true,
    'b1': true, 'b2': true, 'b3': false, 'b4': false,
    'e1': true, 'e2': false, 'e3': false,
    'd1': true, 'd2': false, 'd3': true,
    's1': true, 's2': false, 's3': false,
  };
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(initialChecks);

  const checklistGroups = [
    {
      id: 'crew',
      title: 'Crew & Competency',
      items: [
        { id: 'c1', text: 'Crew competency, valid CoC/CoP and medical fitness verified' },
        { id: 'c2', text: 'Safe Manning Document minimum crew levels satisfied' },
        { id: 'c3', text: 'Shipboard familiarization completed; muster lists posted' },
      ],
    },
    {
      id: 'bridge',
      title: 'Bridge & Navigation',
      items: [
        { id: 'b1', text: 'Passage plan validated berth-to-berth under Master orders' },
        { id: 'b2', text: 'Charts and ENCs updated with latest Notices to Mariners' },
        { id: 'b3', text: 'Radar, ARPA, ECDIS safety contour/depth, and AIS tested' },
        { id: 'b4', text: 'Steering gear, gyro repeaters, and bridge comms tested within 1 hr before departure' },
      ],
    },
    {
      id: 'engine',
      title: 'Engine & Propulsion',
      items: [
        { id: 'e1', text: 'Main engine tested ahead and astern; propulsion logged' },
        { id: 'e2', text: 'Auxiliary diesel generators synchronized & emergency gen auto' },
        { id: 'e3', text: 'Bunker quantity verified, MARPOL BDN logged, OWS 15-ppm checked' },
      ],
    },
    {
      id: 'deck',
      title: 'Deck & Cargo Stability',
      items: [
        { id: 'd1', text: 'Cargo securing verified per Cargo Securing Manual (CSM)' },
        { id: 'd2', text: 'Drafts, trim, GM, and stability stress within approved envelope' },
        { id: 'd3', text: 'Mooring winches & windlass tested; snap-back zones clear' },
      ],
    },
    {
      id: 'safety',
      title: 'Life-Safety & Security',
      items: [
        { id: 's1', text: 'Lifeboats, survival craft ready; EPIRB/SART tested' },
        { id: 's2', text: 'Fire main pressurized & emergency fire pump tested' },
        { id: 's3', text: 'ISPS gangway watch established & visitor log confirmed' },
      ],
    },
  ];

  // --- GLOSSARY STATE ---
  const [glossaryLetter, setGlossaryLetter] = useState('all');
  const [glossaryQuery, setGlossaryQuery] = useState('');

  const filteredGlossary = MARITIME_GLOSSARY.filter((g) => {
    const matchesQuery =
      glossaryQuery === '' ||
      g.abbreviation.toLowerCase().includes(glossaryQuery.toLowerCase()) ||
      g.meaning.toLowerCase().includes(glossaryQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (glossaryLetter === 'all') return true;
    const firstChar = g.abbreviation.charAt(0).toUpperCase();
    if (glossaryLetter === 'A-D') return firstChar >= 'A' && firstChar <= 'D';
    if (glossaryLetter === 'E-H') return firstChar >= 'E' && firstChar <= 'H';
    if (glossaryLetter === 'I-M') return firstChar >= 'I' && firstChar <= 'M';
    if (glossaryLetter === 'N-R') return firstChar >= 'N' && firstChar <= 'R';
    if (glossaryLetter === 'S-Z') return firstChar >= 'S' && firstChar <= 'Z';
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendUKCToChat = () => {
    const text = `Please review my passage clearance calculation for confined water transit:
• Charted Depth: ${chartedDepth}m + Tide: ${tideHeight}m = Total Water Depth: ${totalWaterDepth}m
• Static Draft: ${staticDraft}m | Ship Speed: ${shipSpeed} kts | Block Coeff: ${blockCoeff}
• Channel Type: ${isConfinedChannel ? 'Confined Shallow Channel (2.0x factor)' : 'Open Shallow Water (1.0x factor)'}
• Calculated Squat: ${calculatedSquat}m -> Dynamic Draft: ${dynamicDraft}m
• Net Under-Keel Clearance (UKC): ${netUKC}m (${isUKCDangerous ? 'DANGEROUS GROUNDING RISK' : isUKCCritical ? 'CRITICAL MINIMUM' : 'SAFE CLEARANCE'})

What speed reduction or tidal window is required to maintain the company SMS UKC safety margin under MAR-KB-001 Section 16?`;
    onSendToChat(text);
    onClose();
  };

  const sendChecklistToChat = () => {
    const totalCount = Object.keys(checkedItems).length;
    const completedCount = Object.values(checkedItems).filter(Boolean).length;
    const pendingItems = checklistGroups
      .flatMap((g) => g.items)
      .filter((i) => !checkedItems[i.id])
      .map((i) => i.text);

    const text = `Departure Readiness Checklist Status (§23 Pre-Departure Briefing):
• Completed: ${completedCount} of ${totalCount} mandatory statutory checks.
• Pending/Unchecked items:
${pendingItems.map((p) => `  - [PENDING]: ${p}`).join('\n')}

Under Master authority (MAR-KB-001 §10 and §23), what mitigations or bridge log entries are needed before pilot boarding?`;
    onSendToChat(text);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-2xl bg-[var(--bg-main)] border-t sm:border border-[var(--border-subtle)] shadow-2xl overflow-hidden text-[var(--text-main)] font-sans native-sheet pb-safe sm:pb-0">
        
        {/* Native Mobile Sheet Drag Handle */}
        <div className="sm:hidden w-12 h-1 rounded-full bg-white/20 mx-auto mt-2.5 mb-1 shrink-0 cursor-pointer" onClick={onClose} />

        {/* Top Minimalist Header */}
        <div className="flex items-center justify-between px-4 py-2.5 sm:py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 grid place-items-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-[var(--text-main)]">Maritime Tools</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                §16, §23, §25
              </span>
            </div>
          </div>

          {/* Segmented Top Tabs */}
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              UKC & Squat
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'checklist'
                  ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Pre-Departure
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'glossary'
                  ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Glossary
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          
          {/* TAB 1: UKC CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-3 max-w-2xl mx-auto animate-fadeIn text-xs">
              
              {/* Quick Vessel Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="text-[10px] uppercase font-mono text-[var(--text-subtle)] mr-1">Preset:</span>
                <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  {VESSEL_PRESETS.map((vp) => (
                    <button
                      key={vp.label}
                      onClick={() => {
                        setStaticDraft(vp.draft);
                        setShipSpeed(vp.speed);
                        setBlockCoeff(vp.cb);
                      }}
                      className="px-2.5 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                      {vp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic UKC Result Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isUKCDangerous
                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                    : isUKCCritical
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-semibold">Net Dynamic UKC (Clearance)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/40">
                    {isUKCDangerous ? 'DANGEROUS (<0.3m)' : isUKCCritical ? 'CRITICAL (<1.0m)' : 'SAFE CLEARANCE'}
                  </span>
                </div>
                
                <div className="text-3xl font-bold font-mono my-1 tracking-tight">
                  {netUKC} <span className="text-sm font-normal">meters</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                  <div>
                    <span className="opacity-70 block text-[10px]">Total Water Depth:</span>
                    <span className="font-bold">{totalWaterDepth}m</span>
                  </div>
                  <div>
                    <span className="opacity-70 block text-[10px]">Calculated Squat:</span>
                    <span className="font-bold">+{calculatedSquat}m</span>
                  </div>
                  <div>
                    <span className="opacity-70 block text-[10px]">Dynamic Draft:</span>
                    <span className="font-bold">{dynamicDraft}m</span>
                  </div>
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <label className="text-[10px] text-[var(--text-subtle)] uppercase font-mono">Charted Depth (m)</label>
                  <input type="number" step="0.1" value={chartedDepth} onChange={e => setChartedDepth(parseFloat(e.target.value) || 0)} className="w-full font-mono font-semibold text-sm bg-transparent outline-hidden" />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <label className="text-[10px] text-[var(--text-subtle)] uppercase font-mono">Height of Tide (m)</label>
                  <input type="number" step="0.1" value={tideHeight} onChange={e => setTideHeight(parseFloat(e.target.value) || 0)} className="w-full font-mono font-semibold text-sm bg-transparent outline-hidden" />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <label className="text-[10px] text-[var(--text-subtle)] uppercase font-mono">Static Draft (m)</label>
                  <input type="number" step="0.1" value={staticDraft} onChange={e => setStaticDraft(parseFloat(e.target.value) || 0)} className="w-full font-mono font-semibold text-sm bg-transparent outline-hidden" />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <label className="text-[10px] text-[var(--text-subtle)] uppercase font-mono">Speed Through Water (kts)</label>
                  <input type="number" step="0.5" value={shipSpeed} onChange={e => setShipSpeed(parseFloat(e.target.value) || 0)} className="w-full font-mono font-semibold text-sm bg-transparent outline-hidden" />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <label className="text-[10px] text-[var(--text-subtle)] uppercase font-mono">Block Coefficient (Cb)</label>
                  <input type="number" step="0.01" min="0.6" max="0.95" value={blockCoeff} onChange={e => setBlockCoeff(parseFloat(e.target.value) || 0)} className="w-full font-mono font-semibold text-sm bg-transparent outline-hidden" />
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <label className="text-[10px] text-[var(--text-subtle)] uppercase font-mono">Channel Configuration</label>
                  <button
                    onClick={() => setIsConfinedChannel(!isConfinedChannel)}
                    className={`w-full py-1 rounded font-mono font-semibold text-[11px] transition-colors ${isConfinedChannel ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}
                  >
                    {isConfinedChannel ? 'Confined (2x Squat)' : 'Open Shallow (1x)'}
                  </button>
                </div>
              </div>

              <button
                onClick={sendUKCToChat}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Verify UKC in MarinerAI Chat</span>
              </button>
            </div>
          )}

          {/* TAB 2: PRE-DEPARTURE CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3 max-w-2xl mx-auto animate-fadeIn text-xs">
              
              {/* Segmented Category Filter */}
              <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-x-auto scrollbar-none">
                {[
                  { id: 'all', label: 'All Checks' },
                  { id: 'bridge', label: '🧭 Bridge' },
                  { id: 'engine', label: '⚙️ Engine' },
                  { id: 'deck', label: '📦 Cargo/Deck' },
                  { id: 'safety', label: '🦺 Safety' },
                  { id: 'crew', label: '👨‍✈️ Crew' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setChecklistFilter(c.id as any)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                      checklistFilter === c.id
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Segmented Checklist Items */}
              <div className="space-y-2">
                {checklistGroups
                  .filter((g) => checklistFilter === 'all' || g.id === checklistFilter)
                  .map((grp) => (
                    <div key={grp.id} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="text-[10.5px] font-mono font-semibold text-[var(--text-subtle)] uppercase">{grp.title}</div>
                      <div className="space-y-1">
                        {grp.items.map((item) => (
                          <label
                            key={item.id}
                            onClick={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                            className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checkedItems[item.id] || false}
                              onChange={() => {}}
                              className="mt-0.5 accent-blue-600 rounded"
                            />
                            <span className={`text-xs ${checkedItems[item.id] ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={sendChecklistToChat}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Readiness to MarinerAI</span>
              </button>
            </div>
          )}

          {/* TAB 3: 50+ GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="space-y-3 max-w-2xl mx-auto animate-fadeIn text-xs">
              
              {/* Letter Range Segmented Bar + Search */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                  {['all', 'A-D', 'E-H', 'I-M', 'N-R', 'S-Z'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setGlossaryLetter(range)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        glossaryLetter === range
                          ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="relative w-44 sm:w-56">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                  <input
                    type="text"
                    value={glossaryQuery}
                    onChange={(e) => setGlossaryQuery(e.target.value)}
                    placeholder="Search acronyms..."
                    className="w-full pl-8 pr-2 py-1 text-xs rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] placeholder-[var(--text-subtle)] outline-hidden"
                  />
                </div>
              </div>

              {/* Glossary List */}
              <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
                {filteredGlossary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start justify-between gap-2 hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-400">{item.abbreviation}</span>
                        <span className="text-[10px] text-[var(--text-subtle)]">{item.category}</span>
                      </div>
                      <p className="text-xs text-[var(--text-main)] mt-0.5">{item.meaning}</p>
                    </div>

                    <button
                      onClick={() => handleCopy(`gl-${idx}`, `${item.abbreviation}: ${item.meaning}`)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      title="Copy"
                    >
                      {copiedId === `gl-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
                {filteredGlossary.length === 0 && (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                    No maritime terms found.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
