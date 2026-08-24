/**
 * AP World History: Modern — Six CED Themes
 */
export const APWHM_THEME_KEYWORDS = {
  GOV: {
    label: 'Governance',
    abbr: 'GOV',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    keywords: ['government','state','empire','king','queen','ruler','monarch','dynasty','law','legal','bureaucracy','administration','military','war','army','navy','conquest','rebellion','revolt','revolution','democracy','republic','constitution','tax','tribute','legitimacy','mandate','divine','authority','sovereignty','policy','reform','chancellor','minister','senate','parliament','council','edict','decree','colonialism','imperial'],
  },
  ECN: {
    label: 'Economic Systems',
    abbr: 'ECN',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    keywords: ['trade','commerce','merchant','market','money','currency','coin','wealth','economy','economic','agriculture','crop','harvest','guild','labor','worker','slave','peasant','tax','tribute','silk road','spice','gold','silver','inflation','debt','loan','bank','exchange','profit','manufacture','industry','production','import','export','caravan','ship','port','bazaar','barter','capitalism','feudal','plantation','encomienda','labor system'],
  },
  CDI: {
    label: 'Cultural Developments and Interactions',
    abbr: 'CDI',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    keywords: ['religion','culture','art','literature','music','language','identity','belief','tradition','custom','ritual','ceremony','philosophy','education','scholar','university','library','script','writing','printing','mosque','church','temple','cathedral','shrine','pilgrimage','prayer','priest','monk','shaman','caste','ethnicity','race','gender','family','marriage','patriarchy','matriarchy','convert','missionary','syncretism','reformation','renaissance'],
  },
  SIO: {
    label: 'Social Interactions and Organization',
    abbr: 'SIO',
    color: 'text-red-700 bg-red-50 border-red-200',
    keywords: ['society','social','class','hierarchy','nobility','peasant','serf','slave','free','caste','gender','women','men','family','marriage','kinship','community','urban','rural','city','village','migration','diaspora','cosmopolitan','interaction','cooperation','conflict','inequality','mobility','status','elite','commoner','race','ethnicity'],
  },
  TEC: {
    label: 'Technology and Innovation',
    abbr: 'TEC',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    keywords: ['technology','innovation','invention','tool','machine','weapon','armor','cannon','gunpowder','steel','iron','bronze','irrigation','plow','mill','wheel','compass','astrolabe','printing press','paper','gun','firearm','engineering','construction','architecture','bridge','road','aqueduct','medical','science','astronomy','mathematics','chemistry','alchemy','navigation'],
  },
  ENV: {
    label: 'Humans and the Environment',
    abbr: 'ENV',
    color: 'text-green-700 bg-green-50 border-green-200',
    keywords: ['environment','climate','geography','land','water','river','ocean','sea','mountain','desert','forest','steppe','monsoon','drought','flood','famine','disease','plague','epidemic','pandemic','migration','agriculture','deforestation','erosion','ecology','resource','mineral','animal','crop','silk','cotton','sugar','spice','natural','weather','volcanic','earthquake'],
  },
};

export const APWHM_THEME_ORDER = ['GOV', 'ECN', 'CDI', 'SIO', 'TEC', 'ENV'];

/**
 * AP United States History — Eight CED Themes
 */
export const APUSH_THEME_KEYWORDS = {
  NAT: {
    label: 'American and National Identity',
    abbr: 'NAT',
    color: 'text-red-700 bg-red-50 border-red-200',
    keywords: ['identity','national','american','citizenship','patriotism','manifest','assimilation','nativism','exclusion','inclusion','immigration','naturalization','belong','culture','values','democracy','freedom','liberty','rights','declaration','constitution','amendment','civic'],
  },
  WOR: {
    label: 'America in the World',
    abbr: 'WOR',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    keywords: ['foreign','diplomacy','treaty','war','alliance','imperialism','expansion','overseas','colony','intervention','isolationism','containment','nato','un','cold war','trade','tariff','embargo','foreign policy','international','global','world','europe','asia','latin america','middle east','pacific','atlantic'],
  },
  GEO: {
    label: 'Geography and the Environment',
    abbr: 'GEO',
    color: 'text-green-700 bg-green-50 border-green-200',
    keywords: ['geography','land','territory','frontier','west','expansion','louisiana','oregon','texas','california','environment','natural','resource','conservation','national park','drought','dust bowl','river','coast','region','south','north','midwest','sunbelt','urban','rural','climate','ecology'],
  },
  MIG: {
    label: 'Migration and Settlement',
    abbr: 'MIG',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    keywords: ['migration','immigrant','emigrant','settlement','frontier','colony','plantation','great migration','dust bowl','refugee','ethnic','irish','german','chinese','italian','jewish','mexican','puerto rican','push','pull','urbanization','suburb','sunbelt','trail','wagon','railroad'],
  },
  PCE: {
    label: 'Politics and Civic Engagement',
    abbr: 'PCE',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    keywords: ['politics','party','congress','senate','president','election','vote','suffrage','reform','legislation','law','constitution','amendment','civil rights','protest','movement','activism','labor','progressive','populist','new deal','great society','policy','regulation','court','supreme court'],
  },
  WXT: {
    label: 'Work, Exchange, and Technology',
    abbr: 'WXT',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    keywords: ['labor','work','factory','industry','capitalism','trade','market','economy','technology','innovation','railroad','steam','telegraph','electricity','automobile','computer','internet','agriculture','plantation','slavery','wage','union','strike','industrialization','corporation','monopoly','tariff','bank','depression','recession'],
  },
  SOC: {
    label: 'Social Structures',
    abbr: 'SOC',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    keywords: ['social','class','race','gender','women','slavery','segregation','discrimination','inequality','hierarchy','reform','abolition','suffrage','civil rights','jim crow','reconstruction','populism','progressivism','feminism','poverty','wealth','mobility','community','religion','family','education'],
  },
  ARC: {
    label: 'American and Regional Culture',
    abbr: 'ARC',
    color: 'text-teal-700 bg-teal-50 border-teal-200',
    keywords: ['culture','art','literature','music','religion','education','media','print','newspaper','radio','television','film','popular','jazz','blues','rock','regional','south','north','puritan','evangelical','enlightenment','transcendentalism','harlem renaissance','counterculture','consumerism'],
  },
};

export const APUSH_THEME_ORDER = ['NAT', 'WOR', 'GEO', 'MIG', 'PCE', 'WXT', 'SOC', 'ARC'];

// ── Helpers ────────────────────────────────────────────────────────────────
export function getThemeKeywords(course) {
  return course === 'apush' ? APUSH_THEME_KEYWORDS : APWHM_THEME_KEYWORDS;
}

export function getThemeOrder(course) {
  return course === 'apush' ? APUSH_THEME_ORDER : APWHM_THEME_ORDER;
}

// Backwards-compat aliases (APWHM default)
export const THEME_KEYWORDS = APWHM_THEME_KEYWORDS;
export const THEME_ORDER = APWHM_THEME_ORDER;
