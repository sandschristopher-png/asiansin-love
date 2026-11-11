/**
 * Programmatic SEO hubs: one indexable landing page per city at /[slug] (app/(marketing)/[city]).
 *
 * Copy rule: every product claim here must be true of the live app. Verification is a free,
 * optional selfie check (Verified badge, "Verified profiles only" filter), reputation scores are
 * public, voice intros are optional, messages are screened for scams and off-platform pressure,
 * and reports are reviewed by the team. No invented member counts or response times: add
 * `localStats` only from real data.
 *
 * Compliance rule (Philippines RA 10906, Anti-Mail Order Spouse Act; US IMBRA): never market
 * members for marriage or to foreign nationals. No "wife" / "husband" / "marriage" /
 * "matchmaking" keywords or copy; describe open, mutual, cross-cultural dating instead.
 */

export interface CitySEOData {
  slug: string;
  cityName: string;
  countryName: string;
  countryCode: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  heroBadge: string;
  heroHeadline: string;
  heroHighlight: string;
  heroSubhead: string;
  /** Real figures only (rendered when present). */
  localStats?: {
    activeSingles: string;
    avgResponseTime: string;
    verifiedRate: string;
  };
  searchThemes: {
    heading: string;
    description: string;
    searchTags: string[];
  };
  culturalInsights: {
    title: string;
    description: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export const SITE_URL = 'https://meetin.asia';

export const CITY_SEO_DATA: Record<string, CitySEOData> = {
  cebu: {
    slug: 'cebu',
    cityName: 'Cebu City',
    countryName: 'Philippines',
    countryCode: 'PH',
    metaTitle: 'Cebu Dating & Filipina Singles | Serious International Dating | Meet in Asia',
    metaDescription:
      'Connect with Filipina singles in Cebu City looking for meaningful, long-term international relationships. Public reputation scores, free selfie verification, and messages screened for scams.',
    canonicalUrl: `${SITE_URL}/cebu`,
    primaryKeywords: [
      'Filipina singles',
      'Cebu dating',
      'serious dating Philippines',
      'long-term relationships in Cebu',
      'meet Filipina singles',
      'authentic cross-cultural dating',
    ],
    secondaryKeywords: ['Philippines international dating', 'Cebu singles', 'Visayas dating', 'verified singles Philippines'],
    heroBadge: 'Verified Philippines Dating',
    heroHeadline: 'Connect with Genuine',
    heroHighlight: 'Filipina Singles in Cebu',
    heroSubhead:
      'Meet educated, family-oriented singles in Cebu who are looking for meaningful relationships, lasting companionship, and genuine partnerships built on mutual respect.',
    searchThemes: {
      heading: 'Meaningful Relationships & Dating in Cebu',
      description:
        'Connect with educated, family-oriented Filipina singles looking for genuine companionship and cross-cultural dating based on mutual respect.',
      searchTags: ['Filipina Singles', 'Cebu Dating', 'Serious Relationships', 'Philippines Dating', 'Meet Singles'],
    },
    culturalInsights: [
      {
        title: 'Family Values and Genuine Intent',
        description:
          'Family, respect, and loyalty sit at the heart of dating in Cebu, so relationships here tend to be built slowly, sincerely, and for the long term.',
      },
      {
        title: 'Fluent English Communication',
        description:
          'Cebu is a major educational and business hub in the Visayas where English is widely spoken, which makes cross-cultural conversation easy from the first message.',
      },
      {
        title: 'Modern and Traditional Harmony',
        description:
          'From Cebu IT Park professionals to provincial island warmth, meet singles who combine traditional values with modern career goals.',
      },
    ],
    faq: [
      {
        question: 'How do I meet serious Filipina singles in Cebu?',
        answer:
          'Meet in Asia offers free selfie verification, optional voice intros, and public community reputation scores, so you can focus on genuine singles looking for long-term relationships.',
      },
      {
        question: 'Is Meet in Asia a matchmaking or introduction service?',
        answer:
          'No. Meet in Asia is an open dating community: members create their own profiles, browse, and decide for themselves who to talk to. We never arrange introductions or matches on anyone’s behalf.',
      },
      {
        question: 'Can I date safely without encountering romance scams?',
        answer:
          'Messages are screened automatically for scam patterns and early requests to move off the app, every member has a public reputation score, and reports are reviewed by our team.',
      },
    ],
  },
  manila: {
    slug: 'manila',
    cityName: 'Manila',
    countryName: 'Philippines',
    countryCode: 'PH',
    metaTitle: 'Manila Dating & Filipina Singles | Serious International Dating | Meet in Asia',
    metaDescription:
      'Connect with Filipina singles in Metro Manila looking for meaningful, long-term international relationships. Public reputation scores, free selfie verification, and messages screened for scams.',
    canonicalUrl: `${SITE_URL}/manila`,
    primaryKeywords: [
      'Filipina singles',
      'Manila dating',
      'serious dating Philippines',
      'long-term relationships in Manila',
      'meet Filipina singles',
      'authentic cross-cultural dating',
    ],
    secondaryKeywords: ['Metro Manila singles', 'BGC dating', 'Makati singles', 'Philippines international dating'],
    heroBadge: 'Metro Manila Singles Hub',
    heroHeadline: 'Discover Intentional',
    heroHighlight: 'Filipina Singles in Manila',
    heroSubhead:
      'Meet educated, ambitious, and caring singles across Metro Manila who are looking for authentic, long-term relationships.',
    searchThemes: {
      heading: 'Meaningful Relationships & Dating in Manila',
      description:
        'Meet singles across Bonifacio Global City (BGC), Makati, and Quezon City who want genuine companionship and cross-cultural dating based on mutual respect.',
      searchTags: ['Filipina Singles', 'Manila Dating', 'Serious Relationships', 'Philippines Dating', 'Meet Singles'],
    },
    culturalInsights: [
      {
        title: 'Career-Driven and Cultured',
        description:
          'Manila brings together university-educated professionals, creatives, and entrepreneurs who are open to dating across cultures.',
      },
      {
        title: 'Global Mindset with Warm Hospitality',
        description: 'Experience genuine Filipino warmth (Bayanihan) paired with a worldly outlook that makes cross-cultural dating feel natural.',
      },
      {
        title: 'Active Community Moderation',
        description: 'Messages are screened automatically for scams and off-platform pressure, so you spend your time on sincere conversations.',
      },
    ],
    faq: [
      {
        question: 'What makes Meet in Asia different for dating in Manila?',
        answer:
          'Unlike swipe apps filled with inactive profiles, Meet in Asia offers free selfie verification, voice intros, and public reputation scores, and puts relationship intent front and center.',
      },
      {
        question: 'Is Meet in Asia a matchmaking or introduction service?',
        answer:
          'No. Meet in Asia is an open dating community: members create their own profiles, browse, and decide for themselves who to talk to. We never arrange introductions or matches on anyone’s behalf.',
      },
      {
        question: 'How does Meet in Asia protect its members?',
        answer:
          'Every member has a public reputation score. Asking for money or other breaches of trust can be reported in one tap, and our team reviews reports and removes offending accounts.',
      },
    ],
  },
  bangkok: {
    slug: 'bangkok',
    cityName: 'Bangkok',
    countryName: 'Thailand',
    countryCode: 'TH',
    metaTitle: 'Bangkok Dating & Thai Singles | Serious International Dating | Meet in Asia',
    metaDescription:
      'Meet Thai singles in Bangkok looking for serious, long-term relationships. Verified singles, public reputation scores, and genuine partnerships on Meet in Asia.',
    canonicalUrl: `${SITE_URL}/bangkok`,
    primaryKeywords: ['Thai dating', 'Thai singles', 'Bangkok dating', 'serious dating Thailand', 'meet Thai singles', 'verified singles Bangkok'],
    secondaryKeywords: ['Thailand international dating', 'Bangkok singles', 'long-term relationships Thailand', 'cross-cultural dating Thailand'],
    heroBadge: 'Authentic Thailand Dating',
    heroHeadline: 'Find Real Connection with',
    heroHighlight: 'Thai Singles in Bangkok',
    heroSubhead: 'Start a genuine connection with family-oriented singles in Bangkok who are looking for serious dating and lasting partnerships.',
    searchThemes: {
      heading: 'Serious Dating and Genuine Partnerships in Bangkok',
      description: 'Bangkok is a vibrant hub of singles who value respect, kindness, and long-term commitment across cultures.',
      searchTags: ['Thai Dating', 'Thai Singles', 'Bangkok Dating', 'Serious Relationships', 'Verified Singles'],
    },
    culturalInsights: [
      {
        title: 'Respect and Calm Hearts',
        description: 'Thai culture emphasizes respect, mutual peace (Jai Yen), and care for one another, values that carry into lasting relationships.',
      },
      {
        title: 'Modern Bangkok Urbanites',
        description: 'Meet stylish, educated singles in Sukhumvit, Silom, and Thonglor who are open to dating across cultures.',
      },
      {
        title: 'No Commercial Solicitation',
        description:
          'Selling services or promoting nightlife is against our rules: it can be reported in one tap and is removed after review, keeping the focus on genuine everyday singles.',
      },
    ],
    faq: [
      {
        question: 'How do I find a serious relationship in Bangkok?',
        answer:
          'Filter members by English proficiency, relationship goals, and verified badges on Meet in Asia. Listen to voice intros to gauge real chemistry before you travel.',
      },
      {
        question: 'Are Bangkok singles open to cross-cultural relationships?',
        answer: 'Many singles in Bangkok are open to dating across cultures and value emotional maturity, respect, and shared long-term goals.',
      },
      {
        question: 'How does Meet in Asia keep fake profiles out?',
        answer:
          'Members can complete a free selfie verification that adds a Verified badge, you can limit Discover to verified profiles only, and our team reviews every report.',
      },
    ],
  },
  'phnom-penh': {
    slug: 'phnom-penh',
    cityName: 'Phnom Penh',
    countryName: 'Cambodia',
    countryCode: 'KH',
    metaTitle: 'Phnom Penh Dating & Cambodian Singles | Serious Khmer Dating | Meet in Asia',
    metaDescription:
      'Meet Cambodian singles in Phnom Penh looking for serious, long-term relationships. Verified singles and genuine partnerships on Meet in Asia.',
    canonicalUrl: `${SITE_URL}/phnom-penh`,
    primaryKeywords: [
      'Cambodian singles',
      'Khmer dating',
      'Phnom Penh dating',
      'serious dating Cambodia',
      'meet Cambodian singles',
      'Cambodia international dating',
    ],
    secondaryKeywords: ['Phnom Penh singles', 'verified singles Cambodia', 'long-term relationships Cambodia', 'Asian dating Cambodia'],
    heroBadge: 'Genuine Cambodia Dating',
    heroHeadline: 'Connect with Sincere',
    heroHighlight: 'Cambodian Singles in Phnom Penh',
    heroSubhead:
      'Discover the warmth, family devotion, and sincere relationship intent of singles in Cambodia’s bustling capital.',
    searchThemes: {
      heading: 'Serious Dating and Genuine Partnerships in Phnom Penh',
      description: 'Meet sincere, family-minded singles who value honesty and respect. Find meaningful connection in the Kingdom of Wonder.',
      searchTags: ['Cambodian Singles', 'Khmer Dating', 'Phnom Penh Singles', 'Serious Relationships', 'Verified Singles'],
    },
    culturalInsights: [
      {
        title: 'Respect and Sincerity',
        description: 'Khmer culture values modesty, honesty, and family commitment, which makes for authentic relationships free from superficial games.',
      },
      {
        title: 'Emerging Modern Capital',
        description: 'Phnom Penh is home to young professionals and university students who are multilingual and open to dating across cultures.',
      },
      {
        title: 'Zero Tolerance for Commercial Dating',
        description:
          'Automated message screening and one-tap member reports keep commercial accounts out, so your connections are with people looking for genuine partnerships.',
      },
    ],
    faq: [
      {
        question: 'Are Cambodian singles open to cross-cultural relationships?',
        answer: 'Many singles in Phnom Penh are open to dating across cultures and value character, stability, and family-first commitment.',
      },
      {
        question: 'Can I meet English-speaking singles in Phnom Penh?',
        answer: 'Yes, English is widely studied and spoken by university students and working professionals throughout Phnom Penh.',
      },
      {
        question: 'How do I start dating in Phnom Penh before visiting?',
        answer: 'Use Meet in Asia to browse profiles, exchange voice notes, and build genuine rapport before booking your trip to Cambodia.',
      },
    ],
  },
  'kuala-lumpur': {
    slug: 'kuala-lumpur',
    cityName: 'Kuala Lumpur',
    countryName: 'Malaysia',
    countryCode: 'MY',
    metaTitle: 'Kuala Lumpur Dating | Meet Asian Singles in KL | Meet in Asia',
    metaDescription:
      'Meet singles in Kuala Lumpur, Malaysia looking for serious, long-term international relationships. Verified singles and genuine partnerships on Meet in Asia.',
    canonicalUrl: `${SITE_URL}/kuala-lumpur`,
    primaryKeywords: [
      'Kuala Lumpur dating',
      'KL singles',
      'Malaysian singles',
      'serious dating Malaysia',
      'international dating Malaysia',
      'verified singles KL',
      'Asian singles',
    ],
    secondaryKeywords: ['expat dating Malaysia', 'long-term relationships KL', 'Malaysian Chinese singles', 'serious dating KL'],
    heroBadge: 'Cosmopolitan Malaysia Dating',
    heroHeadline: 'Meet Cultured and Modern',
    heroHighlight: 'Singles in Kuala Lumpur',
    heroSubhead:
      'Connect with worldly, multilingual professionals seeking meaningful international relationships in Malaysia’s vibrant capital.',
    searchThemes: {
      heading: 'Modern Cross-Cultural Dating in Kuala Lumpur',
      description:
        'Discover educated professionals, world travelers, and multilingual singles across KLCC, Bangsar, and Mont Kiara who value serious companionship.',
      searchTags: ['KL Singles', 'Kuala Lumpur Dating', 'Asian Singles', 'Serious Relationships', 'Verified Singles'],
    },
    culturalInsights: [
      {
        title: 'Multilingual and Highly Educated',
        description:
          'Singles in Kuala Lumpur typically speak fluent English, Malay, and Chinese dialects, making cross-border communication effortless.',
      },
      {
        title: 'Cosmopolitan Lifestyle',
        description: 'Meet singles who are well-traveled, self-reliant, and looking for an intellectual and romantic equal.',
      },
      {
        title: 'Verified Conduct Profiles',
        description:
          'Selfie verification and GPS-verified location badges show who is real and where they are, and every member carries a public reputation score.',
      },
    ],
    faq: [
      {
        question: 'Why choose Meet in Asia for dating in Kuala Lumpur?',
        answer:
          'Selfie verification, public reputation scores, and voice intros make it easy to spot real professionals across Malaysia who want something serious.',
      },
      {
        question: 'Is English widely spoken by singles in Kuala Lumpur?',
        answer: 'English is spoken natively or fluently by the vast majority of urban professionals across Kuala Lumpur.',
      },
      {
        question: 'Are members looking for international partners?',
        answer: 'Yes, our community welcomes travelers, expats, and cross-border couples seeking genuine, long-term partnerships.',
      },
    ],
  },
};

export const CITY_SLUGS = Object.keys(CITY_SEO_DATA);

export function getCityData(slug: string): CitySEOData | null {
  return Object.prototype.hasOwnProperty.call(CITY_SEO_DATA, slug) ? CITY_SEO_DATA[slug] : null;
}
