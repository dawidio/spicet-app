// The six AP World History: Modern course themes, as defined in the College
// Board Course and Exam Description (CED). Internal keys are stable legacy
// identifiers (pre-CED naming) so existing charts in IndexedDB keep working —
// only labels, prompts, and display order follow the CED.
export const CATEGORY_CONFIG = {
  interactions: {
    label: 'Humans & the Environment',
    abbr: 'ENV',
    key: 'interactions',
    color: 'interactions',
    icon: 'Globe',
    prompts: [
      'How did geography, climate, or environment shape settlement, agriculture, or expansion?',
      'What migrations occurred, and how did people adapt to new environments?',
      'What diseases or crops spread through contact, and with what demographic effects?',
      'How did societies transform their environments (irrigation, deforestation, industrialization)?',
    ],
  },
  cultural: {
    label: 'Cultural Developments & Interactions',
    abbr: 'CDI',
    key: 'cultural',
    color: 'cultural',
    icon: 'Palette',
    prompts: [
      'What religions, belief systems, or philosophies were practiced or promoted?',
      'What art, architecture, science, or literary achievements were significant?',
      'How did ideas and cultural practices spread, blend, or produce syncretism through contact?',
      'What role did education or intellectual traditions play?',
    ],
  },
  political: {
    label: 'Governance',
    abbr: 'GOV',
    key: 'political',
    color: 'political',
    icon: 'Landmark',
    prompts: [
      'What type of state or political structure existed? (empire, city-state, nation-state, etc.)',
      'How did rulers legitimize and consolidate power? (religion, bureaucracy, military, ideology)',
      'What laws, policies, or political reforms were notable?',
      'How was the state administered — centralized or decentralized, and through whom?',
    ],
  },
  economic: {
    label: 'Economic Systems',
    abbr: 'ECN',
    key: 'economic',
    color: 'economic',
    icon: 'Coins',
    prompts: [
      'How were goods produced, exchanged, and consumed? (agriculture, tribute, trade, industry)',
      'What trade networks connected this society to others? What was traded?',
      'What labor systems existed? (free, coerced, enslaved, wage)',
      'What monetary systems, taxation, or commercial practices were significant?',
    ],
  },
  social: {
    label: 'Social Interactions & Organization',
    abbr: 'SIO',
    key: 'social',
    color: 'social',
    icon: 'Users',
    prompts: [
      'What social classes or hierarchies existed? How were they structured?',
      'What were the roles of men, women, and families in this society?',
      'How did race, ethnicity, or religion shape social organization?',
      'How did social mobility work — could people move between groups? How?',
    ],
  },
  technological: {
    label: 'Technology & Innovation',
    abbr: 'TEC',
    key: 'technological',
    color: 'technological',
    icon: 'Cog',
    prompts: [
      'What innovations or technologies were developed or adopted?',
      'How did technology affect military power, agriculture, transportation, or daily life?',
      'What technologies were borrowed from or spread to other societies?',
      'How did technological change drive political, economic, or social change?',
    ],
  },
};

// CED theme order: ENV, CDI, GOV, ECN, SIO, TEC
export const CATEGORIES_ORDER = [
  'interactions',
  'cultural',
  'political',
  'economic',
  'social',
  'technological',
];
