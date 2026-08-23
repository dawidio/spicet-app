import { useState, useEffect, useCallback } from 'react';
import { syncReviews, getDueReviews, recordReviewMark } from '../lib/db';
import { CATEGORY_CONFIG } from '../data/prompts';
import { AP_WORLD_UNITS } from '../data/units';
import { isMastered, tallyMarks } from '../lib/spacing';
import {
  Brain,
  Eye,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

const SESSION_CAP = 20;

// Literal class maps so Tailwind generates the category colors (same pattern
// as CategorySection).
const badgeClasses = {
  social: 'bg-social text-white',
  political: 'bg-political text-white',
  interactions: 'bg-interactions text-white',
  cultural: 'bg-cultural text-white',
  economic: 'bg-economic text-white',
  technological: 'bg-technological text-white',
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewSession({ onBack }) {
  const [queue, setQueue] = useState(null); // null = loading
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [marks, setMarks] = useState([]); // [{ mark, categoryKey }]

  useEffect(() => {
    (async () => {
      await syncReviews();
      const due = await getDueReviews();
      setQueue(shuffle(due).slice(0, SESSION_CAP));
    })();
  }, []);

  const card = queue && index < queue.length ? queue[index] : null;

  const handleMark = useCallback(
    async (mark) => {
      if (!card) return;
      const updated = await recordReviewMark(card.review.id, mark);
      setMarks((prev) => [...prev, { mark, categoryKey: card.review.categoryKey }]);
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
    [card]
  );

  if (queue === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
        Loading your review queue...
      </div>
    );
  }

  // ── Empty queue ──
  if (queue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🧘</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Nothing due today
        </h2>
        <p className="text-gray-500 mb-6">
          The spiral is quiet. New chart entries enter the queue as you write
          them, and reviewed entries come back on their schedule.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Session complete ──
  if (!card) {
    const tally = tallyMarks(marks);
    const total = marks.length || 1;
    const byTheme = {};
    for (const m of marks) {
      byTheme[m.categoryKey] = byTheme[m.categoryKey] || { knew: 0, other: 0 };
      if (m.mark === 'knew') byTheme[m.categoryKey].knew += 1;
      else byTheme[m.categoryKey].other += 1;
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
              {Object.entries(byTheme).map(([catKey, t]) => {
                const config = CATEGORY_CONFIG[catKey];
                const pct = Math.round((t.knew / (t.knew + t.other)) * 100);
                return (
                  <div key={catKey} className="flex items-center gap-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeClasses[catKey]}`}
                    >
                      {config.label}
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
            onClick={onBack}
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
  const config = CATEGORY_CONFIG[card.review.categoryKey];
  const unit = AP_WORLD_UNITS.find((u) => u.number === card.chart.unitNumber);
  const mastered = isMastered(card.review);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Brain size={16} />
          <span>
            Card {Math.min(index + 1, queue.length)} of {queue.length}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {mastered
            ? 'Spaced review'
            : `Learning — ${card.review.successes}/3 correct`}
        </span>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeClasses[card.review.categoryKey]}`}
          >
            {config.label}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {card.chart.empireName || 'Untitled chart'}
          </span>
          {unit && (
            <span className="text-xs text-gray-400">
              Unit {unit.number}: {unit.name}
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
  );
}
