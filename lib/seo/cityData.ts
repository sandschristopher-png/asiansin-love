/**
 * Programmatic SEO hubs: one indexable landing page per city at /[slug] (app/(marketing)/[city]).
 *
 * Copy rule: every product claim here must be true of the live app. Verification is a free,
 * optional selfie check (Verified badge, "Verified profiles only" filter), reputation scores are
 * public, voice intros are optional, messages are screened for scams and off-platform pressure,
 * and reports are reviewed by the team. No invented member counts or response times: add
 * `localStats` only from real data.
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

export const SITE_URL = 'https://asiansin.love';

export const CITY_SEO_DATA: Record<string, CitySEOData> = {
  cebu: {
    slug: 'cebu',
    cityName: 'Cebu City',
    countryName: 'Philippines',
    countryCode: 'PH',
    metaTitle: 'Cebu Dating & Filipina Singles | Meet Genuine Filipina Women | asiansin.love',
    metaDescription:
      'Meet Filipina singles in Cebu City. Find a genuine Filipina girlfriend or future Filipina wife on asiansin.love, with free selfie verification, public reputation scores and safe cross-cultural dating.',
    canonicalUrl: `${SITE_URL}/cebu`,
    primaryKeywords: [
      'Filipina singles',
      'Filipina girlfriend',
      'Filipina wife',
      'my Filipina',
      'Cebu dating',
      'Cebu Filipina dating',
      'meet Filipinas in Cebu',
    ],
    secondaryKeywords: ['Philippines international dating', 'serious dating Philippines', 'marriage minded Filipina', 'Cebu singles'],
    heroBadge: 'Verified Philippines Dating',
    heroHeadline: 'Connect with Genuine',
    heroHighlight: 'Filipina Singles in Cebu',
    heroSubhead:
      'Meet educated, family-oriented Filipina women looking for meaningful international relationships, lifelong companionship, and authentic marriage-minded partners.',
    searchThemes: {
      heading: 'Find Your Future Filipina Wife in Cebu',
      description:
        'Cebu is known worldwide for warm, English-speaking, family-centered Filipina singles seeking genuine foreign partners for long-term commitment.',
      searchTags: ['Filipina Singles', 'Filipina Girlfriend', 'Cebu Women', 'Filipina Wife', 'Visayas Dating'],
    },
    culturalInsights: [
      {
        title: 'Family Values and Genuine Intent',
        description:
          'Filipinas in Cebu place deep importance on family cohesion, respect, and mutual loyalty, making them exceptional life partners for foreign gentlemen.',
      },
      {
        title: 'Fluent English Communication',
        description:
          'Cebu is a major educational and business hub in the Visayas where English is universally spoken, eliminating language barriers in courtship.',
      },
      {
        title: 'Modern and Traditional Harmony',
        description:
          'From Cebu IT Park professionals to provincial island warmth, find singles who combine traditional loyalty with modern career goals.',
      },
    ],
    faq: [
      {
        question: 'How do I meet serious Filipina singles in Cebu?',
        answer:
          'asiansin.love offers free selfie verification, optional voice intros, and public community reputation scores, so you can focus on genuine Filipina women seeking committed cross-cultural relationships.',
      },
      {
        question: 'Are Filipinas looking for marriage and foreign partners?',
        answer:
          'Yes. Many Filipinas in Cebu are actively looking for mature foreign gentlemen who value respect, honesty, long-term commitment, and shared family values.',
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
    metaTitle: 'Manila Filipina Singles | Meet Your Filipina Girlfriend or Wife | asiansin.love',
    metaDescription:
      'Find genuine Filipina singles in Metro Manila. Connect with professionals, university graduates, and marriage-minded Filipina women ready for real love on asiansin.love.',
    canonicalUrl: `${SITE_URL}/manila`,
    primaryKeywords: [
      'Filipina singles',
      'Filipina girlfriend',
      'Filipina wife',
      'my Filipina',
      'Manila dating',
      'Metro Manila Filipina dating',
      'Filipina dating site',
    ],
    secondaryKeywords: ['BGC dating', 'Makati singles', 'Filipina marriage agency alternative', 'foreign dating Philippines'],
    heroBadge: 'Metro Manila Singles Hub',
    heroHeadline: 'Discover Intentional',
    heroHighlight: 'Filipina Singles in Manila',
    heroSubhead:
      'The premier destination for foreign men seeking authentic relationships with educated, ambitious, and caring Filipina women in Metro Manila.',
    searchThemes: {
      heading: 'Meet Your Filipina Girlfriend in Metro Manila',
      description:
        'Explore profiles across Bonifacio Global City (BGC), Makati, and Quezon City. Connect with Filipinas who desire committed cross-border partnerships.',
      searchTags: ['Filipina Girlfriend', 'Manila Singles', 'Filipina Wife Dating', 'Philippine Matchmaking', 'My Filipina'],
    },
    culturalInsights: [
      {
        title: 'Career-Driven and Cultured',
        description:
          'Manila brings together university-educated career women, creatives, and corporate professionals who are enthusiastic about international romance.',
      },
      {
        title: 'Global Mindset with Warm Hospitality',
        description:
          'Experience genuine Filipino warmth (Bayanihan) paired with a worldly outlook that makes international courtship effortless.',
      },
      {
        title: 'Active Community Moderation',
        description:
          'Messages are screened automatically for scams and off-platform pressure, so you spend your time courting sincere individuals.',
      },
    ],
    faq: [
      {
        question: 'What makes asiansin.love better for finding a Filipina girlfriend in Manila?',
        answer:
          'Unlike swipe apps filled with inactive profiles, asiansin.love offers free selfie verification, voice intros, and public reputation scores, and puts relationship intent front and center.',
      },
      {
        question: 'Do Filipinas in Manila speak fluent English?',
        answer: 'Yes, English is an official language of the Philippines and widely used in business and daily conversation across Metro Manila.',
      },
      {
        question: 'How does asiansin.love protect international singles?',
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
    metaTitle: 'Thai Dating & Thai Wife Dating | Meet Thai Singles in Bangkok | asiansin.love',
    metaDescription:
      'Find genuine Thai singles in Bangkok. Connect with marriage-minded Thai women, find a loving Thai girlfriend, or meet your future Thai wife on asiansin.love.',
    canonicalUrl: `${SITE_URL}/bangkok`,
    primaryKeywords: ['Thai dating', 'Thai singles', 'Thai wife', 'Thai girlfriend', 'Thai wife dating', 'Bangkok dating', 'meet Thai women'],
    secondaryKeywords: ['Thailand international dating', 'serious dating Thailand', 'Bangkok singles club', 'Thai marriage partners'],
    heroBadge: 'Authentic Thailand Dating',
    heroHeadline: 'Find Real Love with',
    heroHighlight: 'Thai Singles in Bangkok',
    heroSubhead:
      'Start a genuine romance with charming, sweet, and family-oriented Thai women looking for committed foreign partners and marriage in Bangkok.',
    searchThemes: {
      heading: 'Find Your Future Thai Wife and Life Companion',
      description:
        'Bangkok is a vibrant hub of gracious Thai women seeking foreign gentlemen who value respect, kindness, and lifelong marriage.',
      searchTags: ['Thai Dating', 'Thai Wife', 'Thai Girlfriend', 'Bangkok Singles', 'Thai Wife Dating'],
    },
    culturalInsights: [
      {
        title: 'Gentle Grace and Cultural Loyalty',
        description:
          'Thai culture emphasizes respect, mutual peace (Jai Yen), and devoted care for partners, creating harmonious and loving marriages.',
      },
      {
        title: 'Modern Bangkok Urbanites',
        description:
          'Meet stylish, educated women in Sukhumvit, Silom, and Thonglor who welcome foreign partners and cross-cultural marriage.',
      },
      {
        title: 'No Commercial Solicitation',
        description:
          'Selling services or promoting nightlife is against our rules: it can be reported in one tap and is removed after review, keeping the focus on genuine everyday singles.',
      },
    ],
    faq: [
      {
        question: 'How do I find a serious Thai girlfriend or Thai wife in Bangkok?',
        answer:
          'Filter members by English proficiency, relationship goals, and verified badges on asiansin.love. Listen to voice intros to gauge real chemistry before you travel.',
      },
      {
        question: 'Are Thai women looking for long-term relationships with foreign men?',
        answer:
          'Many Thai women appreciate foreign men for their emotional maturity, respectful treatment, and dedication to building a secure family future.',
      },
      {
        question: 'How does asiansin.love keep fake Thai dating profiles out?',
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
    metaTitle: 'Cambodian Singles & Khmer Dating | Meet Cambodian Girlfriend | asiansin.love',
    metaDescription:
      'Meet Cambodian singles in Phnom Penh. Connect with genuine Khmer women looking for a dedicated foreign boyfriend or husband on asiansin.love.',
    canonicalUrl: `${SITE_URL}/phnom-penh`,
    primaryKeywords: [
      'Cambodian singles',
      'Cambodian girlfriend',
      'Cambodian wife',
      'Khmer dating',
      'Phnom Penh dating',
      'meet Cambodian women',
      'Cambodia international dating',
    ],
    secondaryKeywords: ['Phnom Penh singles', 'Khmer girlfriend', 'Cambodia marriage dating', 'Asian dating Cambodia'],
    heroBadge: 'Genuine Cambodia Dating',
    heroHeadline: 'Connect with Devoted',
    heroHighlight: 'Cambodian Singles in Phnom Penh',
    heroSubhead:
      'Discover the gentle warmth, deep traditional family devotion, and sincere relationship intent of Khmer women in Cambodia’s bustling capital.',
    searchThemes: {
      heading: 'Meet a Loving Cambodian Girlfriend in Phnom Penh',
      description:
        'Khmer women are celebrated for their sincerity, traditional family loyalty, and respectful character. Find meaningful love in the Kingdom of Wonder.',
      searchTags: ['Cambodian Singles', 'Cambodian Girlfriend', 'Khmer Dating', 'Phnom Penh Singles', 'Cambodian Wife'],
    },
    culturalInsights: [
      {
        title: 'Traditional Respect and Sincerity',
        description:
          'Khmer women value modesty, honesty, and family commitments, providing an authentic relationship free from superficial games.',
      },
      {
        title: 'Emerging Modern Capital',
        description:
          'Phnom Penh boasts young professionals and university students who are multilingual and eager to explore international dating.',
      },
      {
        title: 'Zero Tolerance for Commercial Dating',
        description:
          'Automated message screening and one-tap member reports keep commercial accounts out, so your connections are with people looking for genuine partnerships.',
      },
    ],
    faq: [
      {
        question: 'Are Cambodian singles receptive to foreign men?',
        answer: 'Foreign gentlemen are highly respected in Cambodia for their character, stability, and family-first dedication.',
      },
      {
        question: 'Can I find an English-speaking Cambodian girlfriend in Phnom Penh?',
        answer: 'Yes, English is extensively studied and spoken by university students and working professionals throughout Phnom Penh.',
      },
      {
        question: 'How do I start dating in Phnom Penh before visiting?',
        answer: 'Use asiansin.love to browse profiles, exchange voice notes, and build genuine rapport before booking your trip to Cambodia.',
      },
    ],
  },
  'kuala-lumpur': {
    slug: 'kuala-lumpur',
    cityName: 'Kuala Lumpur',
    countryName: 'Malaysia',
    countryCode: 'MY',
    metaTitle: 'Kuala Lumpur Dating | Meet Asian Singles in KL | asiansin.love',
    metaDescription:
      'Find sophisticated singles in Kuala Lumpur, Malaysia. Connect with educated Asian women seeking serious international relationships on asiansin.love.',
    canonicalUrl: `${SITE_URL}/kuala-lumpur`,
    primaryKeywords: [
      'Kuala Lumpur dating',
      'KL singles',
      'Malaysian Asian singles',
      'meet Asian women in KL',
      'international dating Malaysia',
      'Asian girlfriend KL',
      'Asian singles',
    ],
    secondaryKeywords: ['expat dating Malaysia', 'Kuala Lumpur marriage dating', 'Malaysian Chinese singles', 'serious dating KL'],
    heroBadge: 'Cosmopolitan Malaysia Dating',
    heroHeadline: 'Meet Cultured and Modern',
    heroHighlight: 'Singles in Kuala Lumpur',
    heroSubhead:
      'Connect with worldly, multilingual professionals and educated Asian singles seeking meaningful international relationships in Malaysia’s vibrant capital.',
    searchThemes: {
      heading: 'Modern Cross-Cultural Dating in Kuala Lumpur',
      description:
        'Discover educated professionals, world travelers, and multilingual singles across KLCC, Bangsar, and Mont Kiara who value serious companionship.',
      searchTags: ['KL Singles', 'Kuala Lumpur Dating', 'Asian Singles', 'Malaysian Girlfriend', 'International Dating'],
    },
    culturalInsights: [
      {
        title: 'Multilingual and Highly Educated',
        description:
          'Singles in Kuala Lumpur typically speak fluent English, Malay, and Chinese dialects, making cross-border communication effortless.',
      },
      {
        title: 'Cosmopolitan Lifestyle',
        description:
          'Enjoy dating women who are well-traveled, financially self-reliant, and looking for an intellectual and romantic equal.',
      },
      {
        title: 'Verified Conduct Profiles',
        description:
          'Selfie verification and GPS-verified location badges show who is real and where they are, and every member carries a public reputation score.',
      },
    ],
    faq: [
      {
        question: 'Why choose asiansin.love for dating in Kuala Lumpur?',
        answer:
          'Selfie verification, public reputation scores, and voice intros make it easy to spot real, marriage-minded professionals across Malaysia.',
      },
      {
        question: 'Is English widely spoken by singles in Kuala Lumpur?',
        answer: 'English is spoken natively or fluently by the vast majority of urban professionals across Kuala Lumpur.',
      },
      {
        question: 'Are members looking for international partners?',
        answer: 'Yes, our community caters specifically to foreign travelers, expats, and cross-border couples seeking genuine commitments.',
      },
    ],
  },
};

export const CITY_SLUGS = Object.keys(CITY_SEO_DATA);

export function getCityData(slug: string): CitySEOData | null {
  return Object.prototype.hasOwnProperty.call(CITY_SEO_DATA, slug) ? CITY_SEO_DATA[slug] : null;
}
