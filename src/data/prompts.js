export const CATEGORY_CONFIG = {
  social: {
    label: 'Social',
    key: 'social',
    color: 'social',
    icon: 'Users',
    prompts: [
      'What social classes or hierarchies existed? How were they structured?',
      'What were the roles of men, women, and families in this society?',
      'How did social mobility work — could people move between classes? How?',
      'What was the role of slavery or unfree labor?',
    ],
  },
  political: {
    label: 'Political',
    key: 'political',
    color: 'political',
    icon: 'Landmark',
    prompts: [
      'What type of government or political structure existed? (empire, city-state, theocracy, etc.)',
      'How did rulers legitimize their power? (divine right, mandate, military strength, bureaucracy)',
      'What laws, policies, or political reforms were notable?',
      'How was the empire/region administered? (centralized vs. decentralized, provinces, governors)',
    ],
  },
  interactions: {
    label: 'Interactions',
    key: 'interactions',
    color: 'interactions',
    icon: 'Globe',
    prompts: [
      'What trade networks connected this society to others? What was traded?',
      'What migrations, invasions, or diplomatic relationships shaped this society?',
      'How did geography and environment influence settlement, agriculture, or expansion?',
      'What diseases, crops, or technologies spread through contact?',
    ],
  },
  cultural: {
    label: 'Cultural',
    key: 'cultural',
    color: 'cultural',
    icon: 'Palette',
    prompts: [
      'What religions, belief systems, or philosophies were practiced or promoted?',
      'What art, architecture, or literary achievements were significant?',
      'How did cultural practices spread to or from other societies?',
      'What role did education or intellectual traditions play?',
    ],
  },
  economic: {
    label: 'Economic',
    key: 'economic',
    color: 'economic',
    icon: 'Coins',
    prompts: [
      'What was the basis of the economy? (agriculture, trade, tribute, industry)',
      'What monetary systems, taxation, or trade policies existed?',
      'What role did merchants, guilds, or economic classes play?',
      'How did economic activity connect to other societies?',
    ],
  },
  technological: {
    label: 'Technological',
    key: 'technological',
    color: 'technological',
    icon: 'Cog',
    prompts: [
      'What innovations or technologies were developed or adopted?',
      'How did technology affect military power, agriculture, or daily life?',
      'What technologies were borrowed from or spread to other societies?',
      'How did technological change drive political, economic, or social change?',
    ],
  },
};

export const CATEGORIES_ORDER = [
  'social',
  'political',
  'interactions',
  'cultural',
  'economic',
  'technological',
];
