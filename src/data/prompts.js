// ── AP World History: Modern — Six CED Themes ─────────────────────────────
export const APWHM_CATEGORY_CONFIG = {
  ENV: {
    label: 'Humans and the Environment',
    abbr: 'ENV',
    key: 'ENV',
    color: 'interactions',
    icon: 'Leaf',
    prompts: [
      'How did geography, climate, and natural resources shape settlement and economic activity?',
      'How did humans modify their environment, and what were the ecological consequences?',
      'How did environmental factors (disease, drought, geography) influence historical outcomes?',
      'How did resource extraction, agriculture, or trade disrupt or sustain ecosystems?',
    ],
  },
  CDI: {
    label: 'Cultural Developments and Interactions',
    abbr: 'CDI',
    key: 'CDI',
    color: 'cultural',
    icon: 'Palette',
    prompts: [
      'What religions, philosophies, or belief systems were dominant, and how did they shape daily life?',
      'What artistic, architectural, or literary achievements defined this culture?',
      'How did cultural practices, beliefs, or religions spread to or from other societies?',
      'How did cultural contact produce syncretism, conflict, or transformation?',
    ],
  },
  GOV: {
    label: 'Governance',
    abbr: 'GOV',
    key: 'GOV',
    color: 'political',
    icon: 'Landmark',
    prompts: [
      'What type of political structure existed, and how did rulers legitimize their authority?',
      'How were law, administration, and military force used to maintain order?',
      'What political reforms, crises, or innovations occurred?',
      'How did the state manage diversity, rebellion, or external threats?',
    ],
  },
  ECN: {
    label: 'Economic Systems',
    abbr: 'ECN',
    key: 'ECN',
    color: 'economic',
    icon: 'Coins',
    prompts: [
      'What was the economic foundation (agriculture, trade, tribute, industry)?',
      'What trade networks, monetary systems, or taxation policies shaped economic life?',
      'How did labor systems (slavery, serfdom, free labor) structure the economy?',
      'How did economic activity connect this society to regional or global networks?',
    ],
  },
  SIO: {
    label: 'Social Interactions and Organization',
    abbr: 'SIO',
    key: 'SIO',
    color: 'social',
    icon: 'Users',
    prompts: [
      'How was society organized by class, caste, gender, or ethnicity?',
      'How did social hierarchies shape access to power, wealth, and opportunity?',
      'What was the role of family, community, or social institutions in organizing life?',
      'How did social change happen — and who resisted it?',
    ],
  },
  TEC: {
    label: 'Technology and Innovation',
    abbr: 'TEC',
    key: 'TEC',
    color: 'technological',
    icon: 'Cog',
    prompts: [
      'What technologies were developed or adopted during this period?',
      'How did technology affect military power, agriculture, commerce, or daily life?',
      'What technologies diffused across societies through trade, conquest, or migration?',
      'How did technological change drive or respond to political, economic, or social shifts?',
    ],
  },
};

export const APWHM_CATEGORIES_ORDER = ['ENV', 'CDI', 'GOV', 'ECN', 'SIO', 'TEC'];

// ── AP United States History — Eight CED Themes ───────────────────────────
export const APUSH_CATEGORY_CONFIG = {
  NAT: {
    label: 'American and National Identity',
    abbr: 'NAT',
    key: 'NAT',
    color: 'nat',
    icon: 'Flag',
    prompts: [
      'How did Americans define national identity, and whose definition won out?',
      'What debates arose over who counted as fully American (race, religion, ethnicity)?',
      'How did conflicts over identity shape political movements, laws, or social change?',
      'How did war, immigration, or reform reshape national identity?',
    ],
  },
  WOR: {
    label: 'America in the World',
    abbr: 'WOR',
    key: 'WOR',
    color: 'wor',
    icon: 'Globe',
    prompts: [
      'How did the United States interact with foreign nations, empires, or peoples?',
      'What drove U.S. foreign policy — ideology, economics, security, or expansion?',
      'How did global events or foreign ideologies shape American domestic life?',
      'How did American expansion or imperialism affect other nations and peoples?',
    ],
  },
  GEO: {
    label: 'Geography and the Environment',
    abbr: 'GEO',
    key: 'GEO',
    color: 'geo',
    icon: 'Map',
    prompts: [
      'How did geography shape migration patterns, economic development, or regional conflict?',
      'What natural resources were central to this period\'s economy or politics?',
      'How did Americans interact with and transform their natural environment?',
      'What role did territorial expansion, borders, or environmental crises play?',
    ],
  },
  MIG: {
    label: 'Migration and Settlement',
    abbr: 'MIG',
    key: 'MIG',
    color: 'mig',
    icon: 'Navigation',
    prompts: [
      'Who migrated to, from, or within America during this period, and why?',
      'What pushed people to migrate (war, poverty, persecution) and what pulled them?',
      'How did migration reshape American demographics, culture, and communities?',
      'How were migrants received — with opportunity, hostility, or exclusion?',
    ],
  },
  PCE: {
    label: 'Politics and Civic Engagement',
    abbr: 'PCE',
    key: 'PCE',
    color: 'pce',
    icon: 'Landmark',
    prompts: [
      'How did political parties, institutions, or social movements compete for power?',
      'How did Americans — including excluded groups — seek to influence government?',
      'What laws, policies, or political reforms were most consequential?',
      'How did debates over rights, representation, and power play out?',
    ],
  },
  WXT: {
    label: 'Work, Exchange, and Technology',
    abbr: 'WXT',
    key: 'WXT',
    color: 'wxt',
    icon: 'Cog',
    prompts: [
      'How did labor systems, economic policies, or technology shape American life?',
      'What role did industrialization, capitalism, or new technology play in this period?',
      'How did working conditions, labor movements, or economic inequality affect society?',
      'What economic relationships connected America to the wider world?',
    ],
  },
  SOC: {
    label: 'Social Structures',
    abbr: 'SOC',
    key: 'SOC',
    color: 'soc',
    icon: 'Users',
    prompts: [
      'How was American society organized by race, class, gender, or religion?',
      'How did reform movements challenge or reinforce existing social hierarchies?',
      'What was the experience of marginalized groups — enslaved people, immigrants, women, Native peoples?',
      'How did social mobility work, and who was excluded from it?',
    ],
  },
  ARC: {
    label: 'American and Regional Culture',
    abbr: 'ARC',
    key: 'ARC',
    color: 'arc',
    icon: 'Palette',
    prompts: [
      'What artistic, literary, intellectual, or religious movements defined this period?',
      'How did regional cultures (South, North, West) differ and interact?',
      'How did popular culture, religion, or education shape American values?',
      'How did American culture absorb foreign influences or assert its distinctiveness?',
    ],
  },
};

export const APUSH_CATEGORIES_ORDER = ['NAT', 'WOR', 'GEO', 'MIG', 'PCE', 'WXT', 'SOC', 'ARC'];

// ── Helpers ────────────────────────────────────────────────────────────────
export function getCategoryConfig(course) {
  return course === 'apush' ? APUSH_CATEGORY_CONFIG : APWHM_CATEGORY_CONFIG;
}

export function getCategoriesOrder(course) {
  return course === 'apush' ? APUSH_CATEGORIES_ORDER : APWHM_CATEGORIES_ORDER;
}

// Backwards-compat aliases (APWHM default)
export const CATEGORY_CONFIG = APWHM_CATEGORY_CONFIG;
export const CATEGORIES_ORDER = APWHM_CATEGORIES_ORDER;
