import { useState, useEffect } from 'react';
import { getReviewStats } from '../lib/db';
import { CATEGORIES_ORDER, CATEGORY_CONFIG } from '../data/prompts';
import { ArrowLeft, TrendingUp } from 'lucide-react';

// Literal class maps so Tailwind generates the category colors (same pattern
// as CategorySection / ReviewSession).
const badgeClasses = {
  social: 'bg-social text-white',
  political: 'bg-political text-white',
  interactions: 'bg-interactions text-white',
  cultural: 'bg-cultural text-white',
  economic: 'bg-economic text-white',
  technological: 'bg-technological text-white',
};
const barClasses = {
  social: 'bg-social',
  political: 'bg-political',
  interactions: 'bg-interactions',
  cultural: 'bg-cultural',
  economic: 'bg-economic',
  technological: 'bg-technological',
};

export default function ProgressView({ onBack }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getReviewStats().then(setStats);
  }, []);

  if (stats === null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">
        Crunching your review history...
      </div>
    );
  }

  const themes = CATEGORIES_ORDER.filter((cat) => stats[cat]?.total > 0);
  const totals = themes.reduce(
    (acc, cat) => {
      const s = stats[cat];
      acc.entries += s.total;
      acc.mastered += s.mastered;
      acc.knew += s.marks.knew;
      acc.attempts += s.marks.knew + s.marks.lucky + s.marks.wrong;
      return acc;
    },
    { entries: 0, mastered: 0, knew: 0, attempts: 0 }
  );

  if (themes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">📈</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          No review history yet
        </h2>
        <p className="text-gray-500 mb-6">
          Write chart entries, run review sessions, and your calibration
          picture builds itself here.
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp size={22} className="text-accent" />
        <h2 className="text-2xl font-bold text-gray-900">Your calibration</h2>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Honest marks make this useful: high "knew" with high mastery means the
        spiral is working; high "lucky" means it feels familiar but isn't
        yours yet — aim your next sessions there.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totals.entries}</div>
          <div className="text-xs text-gray-500 mt-1">Entries tracked</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {totals.mastered}
            <span className="text-sm font-normal text-gray-400"> / {totals.entries}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Mastered (3-correct)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {totals.attempts > 0
              ? `${Math.round((totals.knew / totals.attempts) * 100)}%`
              : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Retrieved cold, all time</div>
        </div>
      </div>

      <div className="space-y-3">
        {themes.map((cat) => {
          const s = stats[cat];
          const config = CATEGORY_CONFIG[cat];
          const attempts = s.marks.knew + s.marks.lucky + s.marks.wrong;
          const knewPct = attempts > 0 ? Math.round((s.marks.knew / attempts) * 100) : 0;
          const masteredPct = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0;
          return (
            <div key={cat} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeClasses[cat]}`}
                >
                  {config.label}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {s.total} {s.total === 1 ? 'entry' : 'entries'} · {s.mastered} mastered
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${barClasses[cat]}`}
                  style={{ width: `${masteredPct}%` }}
                  title={`${masteredPct}% mastered`}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>
                  <span className="font-medium text-green-700">{s.marks.knew}</span> knew
                </span>
                <span>
                  <span className="font-medium text-amber-600">{s.marks.lucky}</span> lucky
                </span>
                <span>
                  <span className="font-medium text-red-600">{s.marks.wrong}</span> didn't know
                </span>
                {attempts > 0 && (
                  <span className="ml-auto">{knewPct}% retrieved cold</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Mastered = past the 3-correct learning criterion and into spaced
        relearning. In April, your weakest rows here are your review plan.
      </p>
    </div>
  );
}
