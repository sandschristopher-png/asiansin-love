/**
 * Programmatic SEO city pages: /cities (index) and /cities/[slug] (one page per city).
 *
 * Copy rules (same as lib/seo/cityData.ts):
 * - Every product claim must be true of the live app. Verification is a free, optional selfie
 *   check; reputation scores and voice intros are public; messages are screened for scams and
 *   off-platform pressure; reports go to the team; Visiting Soon trips are a Plus feature.
 * - No invented member counts, response times or "active singles" figures.
 * - Compliance: never market members for marriage, and never market members by nationality or to
 *   foreign nationals (Philippines RA 10906, US IMBRA). No "wife", "husband", "marriage",
 *   "matchmaking", "mail order" or nationality-led wording. Describe open, mutual dating instead.
 * - Each city's copy is written for that city. Nothing is a swapped city name in a shared template.
 */

export interface CityFaq {
  question: string;
  answer: string;
}

export interface City {
  slug: string;
  name: string;
  country: string;
  region: 'Southeast Asia' | 'East Asia';
  /** Title tag, 60 characters or fewer. */
  metaTitle: string;
  /** Meta description, 140 to 160 characters. */
  metaDescription: string;
  heroTagline: string;
  intro: string;
  datingCultureTips: string[];
  firstDateSpots: string[];
  faqs: CityFaq[];
  /** Other city slugs for internal links (3 to 4). */
  nearbySlugs: string[];
  /**
   * false holds the page back: it is left out of generateStaticParams, /cities, nearby links and the
   * sitemap until the product expands beyond Southeast Asia.
   */
  published: boolean;
  /** Date the copy was last changed (YYYY-MM-DD), used for the sitemap lastModified. */
  updated: string;
}

const UPDATED = '2026-11-19';

export const CITIES: City[] = [
  {
    slug: 'manila',
    name: 'Manila',
    country: 'Philippines',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Manila | Meet in Asia',
    metaDescription:
      'Meet people in Manila who want a real connection. Free profiles, public reputation scores, optional selfie verification, and messages screened for scams.',
    heroTagline: 'Makati, BGC, Quezon City and Malate: a city of many small worlds',
    intro:
      'Manila is not one neighborhood. Makati and Bonifacio Global City run on office hours, Quezon City has its own university and café scene, and Malate and Poblacion stay busy late into the night. Meet in Asia lets you see where members live and what they are looking for, with reputation scores and verification you can check before you send a message.',
    datingCultureTips: [
      'Friends often make the first introduction, so a small group meetup can feel easier than a solo first date.',
      'Traffic decides plans. Pick a spot in your own district or along one MRT line, and suggest a time that gives both of you room to get there.',
      'Mall dates are comfortable and easy to reach, but a walk along the Bay or a rooftop bar gives a first meeting more to talk about.',
    ],
    firstDateSpots: ['Bonifacio High Street, BGC', 'Poblacion, Makati', 'Kapitolyo, Pasig'],
    faqs: [
      {
        question: 'Is Meet in Asia free to join in Manila?',
        answer:
          'Creating a profile is free. Some features, such as Visiting Soon trips, are part of Meet in Asia Plus.',
      },
      {
        question: 'How can I tell whether a Manila profile is genuine?',
        answer:
          'Look for the Verified badge from the optional selfie check, the reputation score on each profile, and whether the member has a voice intro or a full set of photos. Messages are screened for scams and off-platform pressure, and you can report anyone.',
      },
      {
        question: 'Can I let people in Manila know I am arriving?',
        answer:
          'Yes. Plus members can add a Visiting Soon trip with arrival and departure dates, a destination and an optional note, so members in that city can see it before you land.',
      },
    ],
    nearbySlugs: ['cebu', 'singapore', 'kuala-lumpur'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'cebu',
    name: 'Cebu City',
    country: 'Philippines',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Cebu City | Meet in Asia',
    metaDescription:
      'Meet people in Cebu City for dating that starts slowly and feels real. Free profiles, reputation scores, optional verification and scam-screened messages.',
    heroTagline: 'IT Park, Ayala and the Mactan coastline, one city with two rhythms',
    intro:
      'Cebu City moves at two speeds. Lahug and the IT Park keep office hours and weekday lunches, while the south and the coastline road to Mactan slow down on weekends. Meet in Asia helps you find members whose schedules and neighborhoods fit yours, and each profile shows a reputation score you can check before you decide to talk.',
    datingCultureTips: [
      'Family matters to many people here, so expect questions about your background early and answer them openly.',
      'Weekends are the usual time for a first meeting. Weekday evenings work too if you keep it to a coffee or a short walk.',
      'A seaside sunset or a food crawl is a relaxed first date. Plan for heat and rain, and keep the first meeting short if you are unsure.',
    ],
    firstDateSpots: ['IT Park, Lahug', 'Ayala Center Cebu', 'Mactan coastline near Lapu-Lapu'],
    faqs: [
      {
        question: 'Do I need a Plus plan to message members in Cebu City?',
        answer:
          'No. Creating a profile is free. Plus adds features such as Visiting Soon trips, which let members in Cebu City see when you are arriving.',
      },
      {
        question: 'What does the selfie verification check?',
        answer:
          'It is a free, optional check that confirms a member is the person in their photos. A verified member shows a Verified badge, and you can filter Discover to verified profiles only.',
      },
      {
        question: 'What should I do if a message asks me to move off the app?',
        answer:
          'Do not send money or personal details. Messages are screened for off-platform pressure, and you can report the member from their profile or the chat.',
      },
    ],
    nearbySlugs: ['manila', 'singapore', 'bangkok'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Bangkok | Meet in Asia',
    metaDescription:
      'Meet people in Bangkok who want a real, mutual connection. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Thonglor, Ari and the river: a city that rewards a good plan',
    intro:
      'Bangkok is spread out, so where you meet matters as much as who you meet. Thonglor and Ekkamai suit evenings after work, Ari has quieter cafés and a local feel, and the riverside along Charoen Krung makes a good first walk. Meet in Asia shows each member’s reputation score and verification status, so you can spend your evenings on people who have shown they are serious.',
    datingCultureTips: [
      'Many people here are polite and cautious at first, so a warm, unhurried first message usually goes further than a long one.',
      'BTS and MRT lines set the map. Choose a meeting point on one line, and check the travel time before you agree.',
      'Street food and night markets make easy first dates, especially when you can sit and talk rather than queue for a table.',
    ],
    firstDateSpots: ['Thonglor (Sukhumvit 55)', 'Ari, Phahon Yothin', 'Charoen Krung riverside'],
    faqs: [
      {
        question: 'Can I browse Bangkok profiles without paying?',
        answer:
          'Yes. You can create a profile and browse Discover for free. Some features, including Visiting Soon trips, are part of Meet in Asia Plus.',
      },
      {
        question: 'Are reputation scores visible to everyone?',
        answer:
          'Yes. Reputation scores are public on each profile so you can judge a member before you message them.',
      },
      {
        question: 'Can I plan a trip to Bangkok on Meet in Asia?',
        answer:
          'Plus members can schedule a Visiting Soon trip with a destination, arrival and departure dates, and an optional note. Members in Bangkok can see it, and it ends automatically after the departure date.',
      },
    ],
    nearbySlugs: ['chiang-mai', 'phuket', 'phnom-penh', 'siem-reap'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'phuket',
    name: 'Phuket',
    country: 'Thailand',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Phuket | Meet in Asia',
    metaDescription:
      'Meet people in Phuket looking for something real. Free profiles, public reputation scores, optional selfie verification and messages screened for scams.',
    heroTagline: 'Old Town, Kata and Rawai: an island where locals and visitors meet',
    intro:
      'Phuket is an island of two lives. Old Town has Sino-Portuguese shophouses, cafés and a Sunday walking street, while Kata and Rawai are beach areas with a steady flow of residents and visitors. Meet in Asia helps you find members who live on the island or who will be there soon, with clear reputation signals so you know who you are talking to.',
    datingCultureTips: [
      'Many people here split time between island work and family on the mainland, so ask about schedules early.',
      'Distances are longer than they look. Choose a meeting point in the same beach area or Old Town, and plan transport before you meet.',
      'Sunset beach walks and seafood dinners are relaxed first dates. Save late-night bars for a second meeting once you know each other.',
    ],
    firstDateSpots: ['Phuket Old Town, Thalang Road', 'Kata Beach', 'Rawai seafood piers'],
    faqs: [
      {
        question: 'Do Phuket members have to live on the island?',
        answer:
          'Not always. Some members live here full time and others are visiting. Check each profile for their location and any Visiting Soon trip.',
      },
      {
        question: 'How do I see whether a Phuket member is verified?',
        answer:
          'Verified members show a Verified badge from the optional selfie check. You can also filter Discover to verified profiles only.',
      },
      {
        question: 'What happens to a Visiting Soon trip after I leave?',
        answer:
          'A Visiting Soon trip shows until its departure date and then drops off. You can also delete it yourself at any time.',
      },
    ],
    nearbySlugs: ['bangkok', 'chiang-mai', 'kuala-lumpur'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'chiang-mai',
    name: 'Chiang Mai',
    country: 'Thailand',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Chiang Mai | Meet in Asia',
    metaDescription:
      'Meet people in Chiang Mai who want real conversation at an easy pace. Free profiles, reputation scores, optional selfie verification and scam screening.',
    heroTagline: 'Nimman, the Old City and the hills: a slower city with a long memory',
    intro:
      'Chiang Mai is smaller and slower than Bangkok, and many people here came for the work, the food or the mountains and stayed. Nimman has cafés and a co-working scene, the Old City has temples and quiet guesthouses, and Santitham feels like a neighborhood. Meet in Asia lets you filter by where people live and find members who want the same easy pace.',
    datingCultureTips: [
      'A relaxed, low-pressure first meeting suits this city. A coffee in Nimman or a walk around the moat is often enough.',
      'Many long-stay residents have a wide circle of friends. Ask about their community, not only their job.',
      'Songthaews and motorbikes are the usual transport. Choose a meeting point you can reach easily from where you are staying.',
    ],
    firstDateSpots: ['Nimmanhaemin Road', 'Chiang Mai Old City moat', 'Santitham cafés'],
    faqs: [
      {
        question: 'Is Chiang Mai a good place to meet long-stay residents?',
        answer:
          'Many members here live in Chiang Mai long term, and others are visiting. Profiles show location details, and Visiting Soon trips show upcoming visits.',
      },
      {
        question: 'Can I report someone who makes me uncomfortable?',
        answer:
          'Yes. You can report a member from their profile or from the chat. Reports are reviewed by the team.',
      },
      {
        question: 'Is there a cost to message members in Chiang Mai?',
        answer:
          'Creating a profile and browsing Discover is free. Meet in Asia Plus adds features such as Visiting Soon trips.',
      },
    ],
    nearbySlugs: ['bangkok', 'phuket', 'siem-reap'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'ho-chi-minh-city',
    name: 'Ho Chi Minh City',
    country: 'Vietnam',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Ho Chi Minh City | Meet in Asia',
    metaDescription:
      'Meet people in Ho Chi Minh City who want a real connection. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'District 1, District 2 and the café streets: a fast city that slows down for good company',
    intro:
      'Ho Chi Minh City, often called Saigon, runs fast on motorbikes and late cafés. District 1 has the historic core and nightlife, District 2 around Thao Dien has a calmer expat-friendly feel, and District 3 is full of neighborhood coffee shops. Meet in Asia helps you find members by district and interests, with reputation scores you can read before you start a conversation.',
    datingCultureTips: [
      'Coffee is the classic first date. A sidewalk café in District 3 or Thao Dien lets you talk without a long commitment.',
      'Traffic is heavy at rush hour. Pick a spot close to where you both are, and build in extra time.',
      'Family and career goals often come up early. Being direct and kind about what you want is usually appreciated.',
    ],
    firstDateSpots: ['Thao Dien, District 2', 'Dong Khoi, District 1', 'Vo Van Tan, District 3 cafés'],
    faqs: [
      {
        question: 'Can I use Meet in Asia in Ho Chi Minh City without paying?',
        answer:
          'Yes. Creating a profile and browsing Discover is free. Some features, such as Visiting Soon trips, need Meet in Asia Plus.',
      },
      {
        question: 'What does a Verified badge mean here?',
        answer:
          'It means the member completed the free, optional selfie check and the photos match. It does not confirm anything else about them, so keep checking profiles and messages.',
      },
      {
        question: 'Can I see who is arriving in Ho Chi Minh City soon?',
        answer:
          'Plus members can add Visiting Soon trips. Members in Ho Chi Minh City see upcoming arrivals on Discover and on the member’s profile until the departure date.',
      },
    ],
    nearbySlugs: ['hanoi', 'phnom-penh', 'bangkok'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'hanoi',
    name: 'Hanoi',
    country: 'Vietnam',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Hanoi | Meet in Asia',
    metaDescription:
      'Meet people in Hanoi who want thoughtful, unhurried dating. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Hoan Kiem Lake, West Lake and the Old Quarter: a city that rewards patience',
    intro:
      'Hanoi rewards patience. The Old Quarter is dense and busy, Hoan Kiem Lake is the calm center of the city, and Tay Ho along West Lake has quieter cafés and a more residential feel. Meet in Asia lets you filter by where people live and read each profile’s reputation score, so you can plan a meeting that suits both of you.',
    datingCultureTips: [
      'Many people here prefer to get to know someone over several meetings, so do not rush to a second date or to big plans.',
      'Cafés with lake views are a natural first meeting. Tay Ho has the most space, and the Old Quarter is best for an evening stroll.',
      'Cooler months are the most comfortable for walking. In summer, plan indoor or shaded spots for a first date.',
    ],
    firstDateSpots: ['Hoan Kiem Lake', 'Tay Ho (West Lake) cafés', 'Ta Hien street, Old Quarter'],
    faqs: [
      {
        question: 'Is Hanoi dating on Meet in Asia mostly for locals?',
        answer:
          'Members here include residents and visitors. Each profile shows its location, and Visiting Soon trips show upcoming visits.',
      },
      {
        question: 'How do reputation scores work?',
        answer:
          'Each profile shows a public reputation score. Use it together with verification and the profile itself when you decide who to talk to.',
      },
      {
        question: 'What if a member asks me for money?',
        answer:
          'Do not send money. Messages are screened for scams and off-platform pressure. Report the member from their profile or the chat, and the team reviews reports.',
      },
    ],
    nearbySlugs: ['ho-chi-minh-city', 'siem-reap', 'bangkok'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'phnom-penh',
    name: 'Phnom Penh',
    country: 'Cambodia',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Phnom Penh | Meet in Asia',
    metaDescription:
      'Meet people in Phnom Penh looking for a genuine connection. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Riverside, Bassac Lane and BKK1: a city of riverside walks and late cafés',
    intro:
      'Phnom Penh is a city that is easy to walk in the evening. The Sisowath Quay riverside fills up at dusk, Bassac Lane has independent cafés and bars, and BKK1 is a quieter residential area with restaurants that stay open late. Meet in Asia helps you find members who live in the city or are visiting, with reputation scores and verification you can check first.',
    datingCultureTips: [
      'Riverside walks at dusk are a natural first date. They are easy to start and easy to end if the meeting is not right.',
      'Many people here value respect and a clear plan. Suggest a specific place and time rather than “let’s see”.',
      'Tuk-tuks are the everyday transport. Agree on a meeting point on a main road so getting there is simple for both of you.',
    ],
    firstDateSpots: ['Sisowath Quay riverside', 'Bassac Lane', 'BKK1 restaurants'],
    faqs: [
      {
        question: 'Can I see whether a Phnom Penh member is a current resident?',
        answer:
          'Profiles show the member’s location. Visiting Soon trips show upcoming visits, so you can tell who is in the city and who is arriving.',
      },
      {
        question: 'Does Meet in Asia verify every member?',
        answer:
          'No. Verification is a free, optional selfie check. Members who complete it show a Verified badge. Unverified members can still use the app, so read their profile carefully.',
      },
      {
        question: 'How do I report a profile?',
        answer:
          'Open the member’s profile or chat and choose report. Reports are reviewed by the team.',
      },
    ],
    nearbySlugs: ['siem-reap', 'ho-chi-minh-city', 'bangkok'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'siem-reap',
    name: 'Siem Reap',
    country: 'Cambodia',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Siem Reap | Meet in Asia',
    metaDescription:
      'Meet people in Siem Reap who want a relaxed, real connection. Free profiles, reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Pub Street, the Old Market and the river: a town built around its visitors and its residents',
    intro:
      'Siem Reap is a small town built around the temples, and it has a steady mix of residents who run businesses here and travelers passing through. Pub Street is lively in the evening, the Old Market area has local food and shops, and the riverside is quieter. Meet in Asia lets you see who is here now and who is arriving, so you can plan something easy and honest.',
    datingCultureTips: [
      'Because the town is small, people often know each other. Be discreet and respectful, and do not make a first meeting public.',
      'Pub Street is busy and loud. For a first meeting, a quieter café or a riverside table works better.',
      'Many visitors have short stays. If you are meeting a traveler, agree early on how long you have together and make plans that fit.',
    ],
    firstDateSpots: ['Old Market area', 'Riverside, Siem Reap River', 'Quiet cafés off Pub Street'],
    faqs: [
      {
        question: 'Will I meet residents or only visitors in Siem Reap?',
        answer:
          'Both. Profiles show each member’s location, and Visiting Soon trips show who is arriving in town and when they leave.',
      },
      {
        question: 'Can I browse Siem Reap profiles for free?',
        answer:
          'Yes. Creating a profile and browsing Discover are free. Visiting Soon trips are part of Meet in Asia Plus.',
      },
      {
        question: 'Can I hide my profile from Discover?',
        answer:
          'Yes. Turn on Hide my profile in Settings and your profile is removed from the Discover feed.',
      },
    ],
    nearbySlugs: ['phnom-penh', 'bangkok', 'hanoi'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'East Asia',
    metaTitle: 'Meet Singles in Tokyo | Meet in Asia',
    metaDescription:
      'Meet people in Tokyo who want a real, mutual connection. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Shimokitazawa, Nakameguro and Ebisu: a city of many neighborhoods and early trains',
    intro:
      'Tokyo is a collection of neighborhoods, each with its own pace. Shimokitazawa has small theaters and vintage shops, Nakameguro has canal-side cafés, and Ebisu has good restaurants that are easy to reach. Meet in Asia helps you find members by area and read each profile’s reputation score before you decide to talk.',
    datingCultureTips: [
      'Trains stop late, so choose a meeting point on a line you can get home from easily.',
      'A first date at a café or a casual izakaya suits most people. Many prefer a clear, short plan over a long evening.',
      'Be clear and polite in your messages. Replies can be thoughtful rather than quick, and that is normal.',
    ],
    firstDateSpots: ['Shimokitazawa', 'Nakameguro canal', 'Ebisu'],
    faqs: [
      {
        question: 'How do I find members in Tokyo?',
        answer:
          'Browse Discover and check each profile for the member’s location, reputation score and verification status before you message.',
      },
      {
        question: 'Can I plan a visit to Tokyo on Meet in Asia?',
        answer:
          'Visiting Soon trips are currently offered for the Southeast Asian destinations listed in the app. Tokyo is not one of them yet.',
      },
      {
        question: 'How do I report a member?',
        answer:
          'Open the member’s profile or the chat and choose report. The team reviews every report.',
      },
    ],
    nearbySlugs: ['seoul', 'taipei', 'singapore'],
    published: false,
    updated: UPDATED,
  },
  {
    slug: 'seoul',
    name: 'Seoul',
    country: 'South Korea',
    region: 'East Asia',
    metaTitle: 'Meet Singles in Seoul | Meet in Asia',
    metaDescription:
      'Meet people in Seoul who want a real, mutual connection. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Seongsu-dong, Itaewon and Hannam-dong: a city of new cafés and old streets',
    intro:
      'Seoul is large and fast, but its neighborhoods feel distinct. Seongsu-dong has converted factories full of cafés and studios, Itaewon has international restaurants and a mix of residents, and Hannam-dong is quieter with galleries. Meet in Asia lets you read profiles, reputation scores and verification status before you start a conversation.',
    datingCultureTips: [
      'Cafés are the most common first date. Seongsu-dong and Hannam-dong have plenty to choose from.',
      'Working hours are long for many people, so weekend afternoons often work better than weeknight plans.',
      'Subway lines make most meeting points easy to reach. Choose a station you both know.',
    ],
    firstDateSpots: ['Seongsu-dong', 'Itaewon', 'Hannam-dong galleries and cafés'],
    faqs: [
      {
        question: 'Can I browse Seoul profiles for free?',
        answer:
          'Yes. Creating a profile and browsing Discover are free. Some features are part of Meet in Asia Plus.',
      },
      {
        question: 'What is the selfie verification?',
        answer:
          'It is a free, optional check that matches your photos to a live selfie. A verified member shows a Verified badge.',
      },
      {
        question: 'Can I add a Visiting Soon trip to Seoul?',
        answer:
          'Visiting Soon trips are offered for listed Southeast Asian destinations only, so you cannot add a Seoul trip yet.',
      },
    ],
    nearbySlugs: ['tokyo', 'taipei', 'singapore'],
    published: false,
    updated: UPDATED,
  },
  {
    slug: 'taipei',
    name: 'Taipei',
    country: 'Taiwan',
    region: 'East Asia',
    metaTitle: 'Meet Singles in Taipei | Meet in Asia',
    metaDescription:
      'Meet people in Taipei who want a real, mutual connection. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Da’an, Ximending and Huashan: a city of parks, night markets and easy transit',
    intro:
      'Taipei is compact and easy to get around by MRT. Da’an has tree-lined streets and cafés near Daan Forest Park, Ximending is busy and youthful, and Huashan 1914 Creative Park is a relaxed place for an afternoon walk. Meet in Asia helps you find members by area and check each profile’s reputation score before you message.',
    datingCultureTips: [
      'Night markets are an easy first date. Walk around, share food and keep the plan flexible.',
      'The MRT makes most meeting points simple to reach. Pick a station you both can get to.',
      'Many people here are direct but considerate. A clear, friendly message usually gets a clear answer.',
    ],
    firstDateSpots: ['Daan Forest Park area', 'Ximending', 'Huashan 1914 Creative Park'],
    faqs: [
      {
        question: 'How do I know a Taipei profile is genuine?',
        answer:
          'Look for the Verified badge from the optional selfie check, the reputation score, and a complete profile. Messages are screened for scams and off-platform pressure.',
      },
      {
        question: 'Is there a fee for Taipei members?',
        answer:
          'Creating a profile and browsing Discover are free. Some features, such as Visiting Soon trips, are part of Meet in Asia Plus.',
      },
      {
        question: 'Can I add a Visiting Soon trip to Taipei?',
        answer:
          'Not yet. Visiting Soon trips are offered for the Southeast Asian destinations listed in the app.',
      },
    ],
    nearbySlugs: ['tokyo', 'seoul', 'singapore'],
    published: false,
    updated: UPDATED,
  },
  {
    slug: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Singapore | Meet in Asia',
    metaDescription:
      'Meet people in Singapore who want a real, mutual connection. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Tiong Bahru, Holland Village and Clarke Quay: a small city that is easy to cross',
    intro:
      'Singapore is small and well connected, so a first meeting is rarely far away. Tiong Bahru has art deco architecture and independent cafés, Holland Village has casual restaurants, and Clarke Quay is by the river. Meet in Asia lets you see where members live and read each profile’s reputation score and verification status before you start a conversation.',
    datingCultureTips: [
      'Schedules are full, so suggest a specific time and place early rather than a vague plan for later.',
      'MRT stations make most meeting points easy. A café near a station you both use keeps things simple.',
      'Many people here value privacy. Respect that, and do not share personal details before you have met.',
    ],
    firstDateSpots: ['Tiong Bahru', 'Holland Village', 'Clarke Quay riverside'],
    faqs: [
      {
        question: 'Can I browse Singapore profiles without paying?',
        answer:
          'Yes. Creating a profile and browsing Discover are free. Visiting Soon trips are part of Meet in Asia Plus.',
      },
      {
        question: 'Do Singapore members have to be verified?',
        answer:
          'No. Verification is a free, optional selfie check. Verified members show a Verified badge, and you can filter Discover to verified profiles only.',
      },
      {
        question: 'Can members in Singapore see when I am visiting?',
        answer:
          'Plus members can add a Visiting Soon trip to a listed destination with arrival and departure dates and an optional note. Singapore is one of the listed destinations.',
      },
    ],
    nearbySlugs: ['kuala-lumpur', 'manila', 'taipei'],
    published: true,
    updated: UPDATED,
  },
  {
    slug: 'kuala-lumpur',
    name: 'Kuala Lumpur',
    country: 'Malaysia',
    region: 'Southeast Asia',
    metaTitle: 'Meet Singles in Kuala Lumpur | Meet in Asia',
    metaDescription:
      'Meet people in Kuala Lumpur who want a real connection. Free profiles, public reputation scores, optional selfie verification and scam-screened messages.',
    heroTagline: 'Bangsar, Bukit Bintang and KLCC: a city of hawker stalls and leafy suburbs',
    intro:
      'Kuala Lumpur blends skyscrapers with hawker stalls. Bangsar has a relaxed village feel with cafés and bars, Bukit Bintang and Jalan Alor are busy after dark, and KLCC is the business heart of the city. Meet in Asia helps you find members by area, with reputation scores and verification you can check before you message.',
    datingCultureTips: [
      'Hawker centers are a comfortable first date. Good food and a casual setting keep the conversation easy.',
      'Traffic is heavy and the LRT and MRT lines are the easiest way around. Pick a station near both of you.',
      'Many people here are family-oriented. Being open about your background and plans is well received.',
    ],
    firstDateSpots: ['Bangsar Village area', 'Jalan Alor, Bukit Bintang', 'KLCC Park'],
    faqs: [
      {
        question: 'Is Meet in Asia free to use in Kuala Lumpur?',
        answer:
          'Creating a profile and browsing Discover are free. Some features, such as Visiting Soon trips, are part of Meet in Asia Plus.',
      },
      {
        question: 'How do reputation scores work?',
        answer:
          'Each profile shows a public reputation score. Use it together with verification, photos and the profile itself.',
      },
      {
        question: 'What should I do if a member pushes me to leave the app?',
        answer:
          'Be cautious. Messages are screened for off-platform pressure. Report the member from the chat or profile, and the team reviews every report.',
      },
    ],
    nearbySlugs: ['singapore', 'manila', 'bangkok'],
    published: true,
    updated: UPDATED,
  },
];

/**
 * Cities whose canonical page is the root-level hub (/cebu, /manila, ...) in app/(marketing)/[city].
 * They keep their copy here for the directory, but /cities/[slug] permanently redirects to the hub,
 * and every link and sitemap entry points at the hub.
 */
export const ROOT_HUB_SLUGS = ['manila', 'cebu', 'bangkok', 'phnom-penh', 'kuala-lumpur'] as const;

export function isRootHub(slug: string): boolean {
  return (ROOT_HUB_SLUGS as readonly string[]).includes(slug);
}

/** Cities that are live: published and not a root hub (these get their own /cities/[slug] page). */
export const CITY_PAGE_CITIES: City[] = CITIES.filter((c) => c.published && !isRootHub(c.slug));

/** Slugs for generateStaticParams on /cities/[slug]. */
export const CITY_SLUGS: string[] = CITY_PAGE_CITIES.map((c) => c.slug);

/** Every published city, in directory order (root hubs included). */
export const PUBLISHED_CITIES: City[] = CITIES.filter((c) => c.published);

/** Canonical URL path for a city: the root hub for the five overlapping cities, /cities/[slug] otherwise. */
export function cityHref(slug: string): string {
  return isRootHub(slug) ? `/${slug}` : `/cities/${slug}`;
}

/** Looks up a city by slug (published or not). */
export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

/** Latest content update across published cities (sitemap lastModified for the index). */
export const CITIES_UPDATED = PUBLISHED_CITIES.reduce((latest, c) => (c.updated > latest ? c.updated : latest), UPDATED);
