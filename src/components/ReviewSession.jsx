import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  syncReviews,
  getDueReviews,
  getAllReviewCards,
  recordReviewMark,
  startStudySession,
  endStudySession,
} from '../lib/db';
import { getCategoryConfig } from '../data/prompts';
import { AP_WORLD_UNITS, APUSH_PERIODS } from '../data/units';
import { isMastered, tallyMarks } from '../lib/spacing';
import {
  Brain,
  Eye,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const SESSION_CAP = 20;

// Literal class maps so Tailwind generates the category colors (same pattern
// as CategorySection). Keyed by the `color` token on each theme's config.
const badgeClasses = {
  // APWHM
  social: 'bg-social text-white',
  political: 'bg-political text-white',
  interactions: 'bg-interactions text-white',
  cultural: 'bg-cultural text-white',
  economic: 'bg-economic text-white',
  technological: 'bg-technological text-white',
  // APUSH
  nat: 'bg-nat text-white',
  wor: 'bg-wor text-white',
  geo: 'bg-geo text-white',
  mig: 'bg-mig text-white',
  pce: 'bg-pce text-white',
  wxt: 'bg-wxt text-white',
  soc: 'bg-soc text-white',
  arc: 'bg-arc text-white',
};

const FALLBACK_BADGE = 'bg-gray-500 text-white';

function themeConfig(card) {
  const course = card.chart?.course || 'apwhm';
  return getCategoryConfig(course)[card.review.categoryKey] || null;
}

function badgeFor(card) {
  const config = themeConfig(card);
  return badgeClasses[config?.color] || FALLBACK_BADGE;
}

function unitFor(chart) {
  const list = (chart?.course || 'apwhm') === 'apush' ? APUSH_PERIODS : AP_WORLD_UNITS;
  return list.find((u) => u.number === chart?.unitNumber);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewSession({ onBack }) {
  const [allCards, setAllCards] = useState(null); // every review row, joined
  const [dueIds, setDueIds] = useState(null); // ids of the rows due right now
  const [queue, setQueue] = useState(null); // null = loading
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [marks, setMarks] = useState([]); // [{ mark, categoryKey, course }]
  const [showScope, setShowScope] = useState(false);
  const [mode, setMode] = useState('due'); // 'due' (default) | 'all'
  const [selectedChartIds, setSelectedChartIds] = useState(null); // null = every chart
  const sessionIdRef = useRef(null);
  const marksRef = useRef([]);

  // "Due everything" is the default: load the due queue straight away.
  useEffect(() => {
    (async () => {
      await syncReviews();
      const [due, all] = await Promise.all([getDueReviews(), getAllReviewCards()]);
      setDueIds(new Set(due.map((c) => c.review.id)));
      setAllCards(all);
      setQueue(shuffle(due).slice(0, SESSION_CAP));
    })();
  }, []);

  // Charts represented in the review pool, for the scope picker.
  const scopeCharts = useMemo(() => {
    if (!allCards) return [];
    const byId = new Map();
    for (const card of allCards) {
      if (card.chart && !byId.has(card.chart.id)) byId.set(card.chart.id, card.chart);
    }
    return [...byId.values()];
  }, [allCards]);

  const scopedCards = useMemo(() => {
    if (!allCards || !dueIds) return [];
    return allCards.filter((card) => {
      if (selectedChartIds && !selectedChartIds.includes(card.chart?.id)) return false;
      if (mode === 'due' && !dueIds.has(card.review.id)) return false;
      return true;
    });
  }, [allCards, dueIds, selectedChartIds, mode]);

  // Open a study-session row the first time a card is marked.
  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current !== null) return;
    sessionIdRef.current = await startStudySession(mode);
  }, [mode]);

  const closeSession = useCallback(async () => {
    const id = sessionIdRef.current;
    if (id === null) return;
    sessionIdRef.current = null;
    const recorded = marksRef.current;
    const correct = recorded.filter((m) => m.mark === 'knew').length;
    await endStudySession(id, recorded.length, correct);
  }, []);

  // Close an abandoned session if the student walks away mid-queue.
  useEffect(() => () => { closeSession(); }, [closeSession]);

  const handleBack = useCallback(async () => {
    await closeSession();
    onBack();
  }, [closeSession, onBack]);

  const applyScope = useCallback(() => {
    setShowScope(false);
    setQueue(shuffle(scopedCards).slice(0, SESSION_CAP));
    setIndex(0);
    setRevealed(false);
    setMarks([]);
    marksRef.current = [];
  }, [scopedCards]);

  const card = queue && index < queue.length ? queue[index] : null;

  const handleMark = useCallback(
    async (mark) => {
      if (!card) return;
      await ensureSession();
      const updated = await recordReviewMark(card.review.id, mark);
      const entry = {
        mark,
        categoryKey: card.review.categoryKey,
        course: card.chart?.course || 'apwhm',
        color: themeConfig(card)?.color,
        label: themeConfig(card)?.label || card.review.categoryKey,
      };
      marksRef.current = [...marksRef.current, entry];
      setMarks(marksRef.current);
      setRevealed(false);

      setQueue((prev) => {
        // Learning-phase cards that aren't mastered yet come back later in
        // this same session — 3 correct retrievals in session one is the
        // protocol, not one-and-done.
        if (updated && !isMastered(updated)) {
          const requeued = { ...card, review: updated };
          return [...prev, requeued];
        }
        return prev;
      });
      setIndex((i) => i + 1);
    },
    [card, ensureSession]
  );

  // Close the session row the moment the queue runs out.
  useEffect(() => {
    if (queue && queue.length > 0 && index >= queue.length) closeSession();
  }, [queue, index, closeSession]);

  if (queue === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
        Loading your review queue...
      </div>
    );
  }

  // ── Scope picker (optional step, opened on request) ──
  const scopePicker = showScope && (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Choose what to review</h2>
          </div>
          <button
            onClick={() => setShowScope(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Charts</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scopeCharts.map((chart) => {
              const checked = !selectedChartIds || selectedChartIds.includes(chart.id);
              return (
                <label
                  key={chart.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = selectedChartIds || scopeCharts.map((c) => c.id);
                      setSelectedChartIds(
                        current.includes(chart.id)
                          ? current.filter((x) => x !== chart.id)
                          : [...current, chart.id]
                      );
                    }}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-gray-800">
                    {chart.empireName || 'Untitled'}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {(chart.course || 'apwhm') === 'apush' ? 'APUSH' : 'APWHM'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Which entries?</h3>
          <div className="flex gap-3">
            {[
              { value: 'due', label: 'Due today only' },
              { value: 'all', label: 'All entries' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  mode === opt.value
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Drilling entries that aren't due yet still counts as retrieval — it
            just won't push their schedule out as far as waiting would have.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
          <span className="font-semibold">
            {Math.min(scopedCards.length, SESSION_CAP)}
          </span>{' '}
          card{scopedCards.length === 1 ? '' : 's'} in this session
          {scopedCards.length > SESSION_CAP && ` (capped from ${scopedCards.length})`}
        </div>

        <button
          onClick={applyScope}
          disabled={scopedCards.length === 0}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Brain size={20} />
          Start session
        </button>
      </div>
    </div>
  );

  // ── Empty queue ──
  if (queue.length === 0) {
    return (
      <>
        {scopePicker}
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🧘</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {mode === 'due' ? 'Nothing due today' : 'Nothing to review'}
          </h2>
          <p className="text-gray-500 mb-6">
            The spiral is quiet. New chart entries enter the queue as you write
            them, and reviewed entries come back on their schedule.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {allCards && allCards.length > 0 && (
              <button
                onClick={() => setShowScope(true)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <SlidersHorizontal size={18} />
                Review something anyway
              </button>
            )}
            <button
              onClick={handleBack}
              className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Session complete ──
  if (!card) {
    const tally = tallyMarks(marks);
    const byTheme = {};
    for (const m of marks) {
      const key = `${m.course}:${m.categoryKey}`;
      byTheme[key] = byTheme[key] || { knew: 0, other: 0, label: m.label, color: m.color };
      if (m.mark === 'knew') byTheme[key].knew += 1;
      else byTheme[key].other += 1;
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Sparkles size={40} className="mx-auto text-accent mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Session complete
          </h2>
          <p className="text-gray-500">
            {marks.length} retrieval{marks.length === 1 ? '' : 's'} — every one
            of them strengthens the memory more than rereading would have.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{tally.knew}</div>
            <div className="text-xs text-green-700 mt-1">Knew it</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{tally.lucky}</div>
            <div className="text-xs text-amber-700 mt-1">Lucky guess</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{tally.wrong}</div>
            <div className="text-xs text-red-700 mt-1">Didn't know</div>
          </div>
        </div>

        {Object.keys(byTheme).length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              By theme — where to aim your next study session
            </h3>
            <div className="space-y-2">
              {Object.entries(byTheme).map(([key, t]) => {
                const pct = Math.round((t.knew / (t.knew + t.other)) * 100);
                return (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        badgeClasses[t.color] || FALLBACK_BADGE
                      }`}
                    >
                      {t.label}
                    </span>
                    <span className="text-gray-500 ml-auto">{pct}% known</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6 text-center">
          Honest marks make this work: "lucky guess" scheduled sooner than
          "knew it" — that's calibration, and it's the difference between
          feeling ready and being ready.
        </p>

        <div className="text-center">
          <button
            onClick={handleBack}
            className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Active card ──
  const config = themeConfig(card);
  const unit = unitFor(card.chart);
  const mastered = isMastered(card.review);
  const unitWord = (card.chart?.course || 'apwhm') === 'apush' ? 'Period' : 'Unit';

  return (
    <>
      {scopePicker}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Brain size={16} />
            <span>
              Card {Math.min(index + 1, queue.length)} of {queue.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {mastered
                ? 'Spaced review'
                : `Learning — ${card.review.successes}/3 correct`}
            </span>
            <button
              onClick={() => setShowScope(true)}
              className="text-xs text-gray-500 hover:text-primary inline-flex items-center gap-1"
              title="Choose which charts and entries to review"
            >
              <SlidersHorizontal size={14} />
              Scope
            </button>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeFor(card)}`}
            >
              {config?.label || card.review.categoryKey}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {card.chart.empireName || 'Untitled chart'}
            </span>
            {unit && (
              <span className="text-xs text-gray-400">
                {unitWord} {unit.number}: {unit.name}
              </span>
            )}
          </div>

          <div className="px-6 py-8">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
              Your claim
            </p>
            <p className="text-lg text-gray-900 font-medium mb-6">
              {card.entry.claim}
            </p>

            {!revealed ? (
              <>
                <p className="text-sm text-gray-500 mb-6">
                  Retrieve it before you look: what's your <strong>evidence</strong>,
                  and <strong>why does it matter</strong>? Say it out loud or in
                  your head — actually retrieving is the part that counts.
                </p>
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Eye size={18} />
                  Show my evidence
                </button>
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                    Your evidence
                  </p>
                  <p className="text-gray-800">
                    {card.entry.evidence?.trim() || (
                      <span className="italic text-gray-400">
                        No evidence written yet — that's a gap worth filling in
                        the editor.
                      </span>
                    )}
                  </p>
                  {card.entry.citation?.trim() && (
                    <p className="text-xs text-gray-400 mt-2">
                      Source: {card.entry.citation}
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-3">Be honest — it's how the schedule works:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleMark('knew')}
                    className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center gap-1 text-sm font-medium"
                  >
                    <CheckCircle2 size={18} />
                    Knew it
                  </button>
                  <button
                    onClick={() => handleMark('lucky')}
                    className="py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex flex-col items-center gap-1 text-sm font-medium"
                  >
                    <HelpCircle size={18} />
                    Lucky guess
                  </button>
                  <button
                    onClick={() => handleMark('wrong')}
                    className="py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex flex-col items-center gap-1 text-sm font-medium"
                  >
                    <XCircle size={18} />
                    Didn't know
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
