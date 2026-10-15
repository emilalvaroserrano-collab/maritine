import React, { useState } from 'react';
import { MARITIME_SECTIONS, KnowledgeSection } from '../data/maritimeKnowledge.ts';
import { Search, X, BookOpen, Send, ShieldAlert, Table, ListCheck, FileText } from 'lucide-react';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAboutSection?: (section: KnowledgeSection) => void;
}

const CATEGORY_MAP: Record<string, string[]> = {
  all: [],
  nav: ['04', '05', '16'],
  engine: ['08', '14'],
  cargo: ['06', '07', '15'],
  safety: ['09', '10', '17', '18', '21'],
  admin: ['01', '02', '03', '11', '12', '13', '19', '20', '22', '23', '24', '25', '26'],
};

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  onAskAboutSection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'nav' | 'engine' | 'cargo' | 'safety' | 'admin'>('all');
  const [selectedSection, setSelectedSection] = useState<KnowledgeSection | null>(MARITIME_SECTIONS[0]);
  const [sectionViewTab, setSectionViewTab] = useState<'overview' | 'requirements' | 'matrix'>('overview');

  if (!isOpen) return null;

  const filteredSections = MARITIME_SECTIONS.filter((sec) => {
    const matchesSearch =
      searchTerm === '' ||
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.number.includes(searchTerm) ||
      sec.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    return CATEGORY_MAP[selectedCategory]?.includes(sec.number);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden text-[var(--text-main)] font-sans">
        
        {/* Top Minimalist Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 grid place-items-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-[var(--text-main)]">MAR-KB-001 Knowledge Base</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                26 Sections
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Category Filter Bar + Search */}
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All (26)' },
              { id: 'nav', label: '🧭 Bridge' },
              { id: 'engine', label: '⚙️ Engine' },
              { id: 'cargo', label: '📦 Cargo' },
              { id: 'safety', label: '🛡️ Safety' },
              { id: 'admin', label: '📜 Regs & MLC' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              type="text"
              placeholder="Search sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-main)] placeholder-[var(--text-subtle)] outline-hidden"
            />
          </div>
        </div>

        {/* Master-Detail Split Pane */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Section List (Left Pane) */}
          <div className="w-full md:w-80 border-r border-[var(--border-subtle)] overflow-y-auto bg-[var(--bg-sidebar)] p-2 space-y-1 shrink-0">
            {filteredSections.map((sec) => {
              const isSelected = selectedSection?.id === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSelectedSection(sec);
                    setSectionViewTab('overview');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-surface)] border border-blue-500/40 shadow-xs'
                      : 'hover:bg-[var(--bg-surface)]/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-blue-400">§{sec.number}</span>
                    <span className="text-[10px] text-[var(--text-subtle)]">{sec.tags[0]}</span>
                  </div>
                  <h4 className="text-xs font-medium text-[var(--text-main)] truncate">
                    {sec.title}
                  </h4>
                </button>
              );
            })}
            {filteredSections.length === 0 && (
              <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                No sections found matching "{searchTerm}".
              </div>
            )}
          </div>

          {/* Section Detail (Right Pane - Segmented on-demand display) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {selectedSection ? (
              <div className="space-y-3 animate-fadeIn text-xs">
                
                {/* Header & Ask AI action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[var(--border-subtle)] gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        SECTION {selectedSection.number}
                      </span>
                      <span className="text-[10px] text-[var(--text-subtle)] font-mono">MAR-KB-001</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text-main)]">
                      {selectedSection.title}
                    </h3>
                  </div>

                  {onAskAboutSection && (
                    <button
                      onClick={() => {
                        onAskAboutSection(selectedSection);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask AI</span>
                    </button>
                  )}
                </div>

                {/* Segmented Reader Tabs */}
                <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                  <button
                    onClick={() => setSectionViewTab('overview')}
                    className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                      sectionViewTab === 'overview'
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Overview</span>
                  </button>

                  <button
                    onClick={() => setSectionViewTab('requirements')}
                    className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                      sectionViewTab === 'requirements'
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <ListCheck className="w-3 h-3" />
                    <span>Requirements ({selectedSection.items?.length || 0})</span>
                  </button>

                  {selectedSection.tableData && selectedSection.tableData.length > 0 && (
                    <button
                      onClick={() => setSectionViewTab('matrix')}
                      className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                        sectionViewTab === 'matrix'
                          ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Table className="w-3 h-3" />
                      <span>Standard Matrix</span>
                    </button>
                  )}
                </div>

                {/* View 1: Overview & Key Rules */}
                {sectionViewTab === 'overview' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                      <span className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Operational Synopsis</span>
                      <p className="text-xs text-[var(--text-main)] leading-relaxed">{selectedSection.summary}</p>
                    </div>

                    {selectedSection.keyRules && selectedSection.keyRules.length > 0 && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200/90 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Safety Boundaries & Enforcements</span>
                        </div>
                        {selectedSection.keyRules.map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-[var(--text-main)]">
                            <span className="text-red-400 font-bold">•</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* View 2: Requirements */}
                {sectionViewTab === 'requirements' && selectedSection.items && (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="space-y-1.5">
                      {selectedSection.items.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-2">
                          <span className="text-blue-400 font-bold">•</span>
                          <span className="text-xs text-[var(--text-main)] leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View 3: Matrix */}
                {sectionViewTab === 'matrix' && selectedSection.tableData && (
                  <div className="rounded-xl border border-[var(--border-subtle)] overflow-x-auto bg-[var(--bg-surface)] animate-fadeIn">
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {selectedSection.tableData.map((row, idx) => {
                          const keys = Object.keys(row);
                          return (
                            <tr key={idx} className="hover:bg-[var(--bg-surface-hover)]/30">
                              <td className="py-2 px-3 font-semibold text-blue-400 w-1/3">{row[keys[0]]}</td>
                              <td className="py-2 px-3 text-[var(--text-main)]">{row[keys[1]]}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                Select a section to inspect details.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
