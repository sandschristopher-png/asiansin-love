export const SEA_COUNTRIES = [
  'Philippines',
  'Thailand',
  'Vietnam',
  'Cambodia',
  'Laos',
  'Indonesia',
  'Malaysia',
  'Singapore',
] as const

export type SeaCountry = typeof SEA_COUNTRIES[number]

export const COUNTRY_FILTER_OPTIONS = [
  { label: 'All Southeast Asia', value: 'All' },
  { label: 'Philippines 🇵🇭', value: 'Philippines' },
  { label: 'Thailand 🇹🇭', value: 'Thailand' },
  { label: 'Vietnam 🇻🇳', value: 'Vietnam' },
  { label: 'Cambodia 🇰🇭', value: 'Cambodia' },
  { label: 'Laos 🇱🇦', value: 'Laos' },
  { label: 'Indonesia 🇮🇩', value: 'Indonesia' },
  { label: 'Malaysia 🇲🇾', value: 'Malaysia' },
  { label: 'Singapore 🇸🇬', value: 'Singapore' },
]
