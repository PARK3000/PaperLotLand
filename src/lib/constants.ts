/**
 * PaperLotLand — Site-wide content constants.
 */

import { siteConfig, businessConfig } from './config'

export const SITE = {
  name: siteConfig.siteName,
  tagline: siteConfig.siteTagline,
  description: siteConfig.siteDescription,
  url: siteConfig.siteUrl,
}

export const BUSINESS = {
  name: businessConfig.name,
  tagline: siteConfig.siteTagline,
  phone: businessConfig.contact.phone,
  phoneDisplay: businessConfig.contact.phoneDisplay,
  email: businessConfig.contact.email,
  address: `${businessConfig.address.street} ${businessConfig.address.suite || ''}, ${businessConfig.address.city}, ${businessConfig.address.state} ${businessConfig.address.zip}`.trim(),
  hours: businessConfig.hoursDisplay || 'Mon–Fri 9 AM – 5 PM',
  license: ' S.181333 Parker Gibbons, Galindo Group Real Estate, Broker Joshua Galindo B.1001607.LLC 4160 S Durango #120 Las Vegas NV 89147 ',
  yearFounded: businessConfig.yearEstablished || '2020',
  serviceArea: businessConfig.serviceArea || 'Clark County, NV',
}

export const NAVIGATION = [
  { label: 'Available Lots', href: '/available-lots/' },
  { label: 'Closed Sales', href: '/closed-sales/' },
  {
    label: 'Resources',
    href: '/resources/',
    children: [
      { label: 'Clark County GIS / GISMO', href: '/resources/clark-county/' },
      { label: 'Henderson Zoning', href: '/resources/henderson/' },
      { label: 'North Las Vegas', href: '/resources/north-las-vegas/' },
      { label: 'Boulder City', href: '/resources/boulder-city/' },
      { label: 'City of Las Vegas', href: '/resources/las-vegas/' },
    ],
  },
  { label: 'Blog', href: '/blog/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
]

export const FOOTER_NAV = {
  main: [
    { label: 'Available Lots', href: '/available-lots/' },
    { label: 'Closed Sales', href: '/closed-sales/' },
    { label: 'Off-Market Deals', href: '/off-market-deals/' },
    { label: 'GIS Resources', href: '/resources/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'About', href: '/about/' },
    { label: 'Contact', href: '/contact/' },
  ],
  secondary: [
    { label: 'Privacy Policy', href: '/privacy-policy/' },
  ],
}

export const TRUST_STATS = [
  { value: '$200M+', label: 'in Clark County land transactions', icon: '🏗️' },
  { value: '200+', label: 'lots bought & sold', icon: '📋' },
  { value: '15+', label: 'years in the Las Vegas market', icon: '📅' },
  { value: '100%', label: 'off-market network', icon: '🔒' },
]

export const VALUE_PROPS = [
  {
    title: 'Off-Market Access',
    description:
      'Get notified on land deals before they hit the MLS. Our network of developers, brokers, and landowners moves inventory privately — giving you a first look at the best parcels in Clark County.',
    icon: '🔑',
  },
  {
    title: 'GIS & Zoning Data',
    description:
      'Direct links to Clark County GISMO, parcel maps, and zoning codes for every jurisdiction in the valley — Las Vegas, Henderson, North Las Vegas, and Boulder City — in one place.',
    icon: '🗺️',
  },
  {
    title: 'Developer Network',
    description:
      'Connect with the buyers, sellers, engineers, and entitlement specialists who move land in the Las Vegas Valley. Whether you need a buyer, a seller, or a due-diligence partner, we can help.',
    icon: '🤝',
  },
]

export const PROCESS_STEPS = [
  {
    number: 1,
    title: 'Join the Network',
    shortTitle: 'Join',
    description:
      "Submit your name, email, phone, and what you're looking for. Takes under two minutes. We keep every submission confidential.",
  },
  {
    number: 2,
    title: 'Receive Deal Alerts',
    shortTitle: 'Get Alerts',
    description:
      'When an off-market parcel matches your criteria, we reach out directly — before anyone else sees it. Sellers and buyers alike submit deals to us first.',
  },
  {
    number: 3,
    title: 'Underwrite & Close',
    shortTitle: 'Close',
    description:
      'We help you access GIS data, zoning, and entitlement history so you can underwrite confidently. Then we close — fast, clean, and off-market.',
  },
]

export const KEY_FEATURES = [
  { title: 'Residential Lots', description: 'Single-family, townhome, and condo pads across the Las Vegas Valley.', icon: '🏠' },
  { title: 'Commercial Land', description: 'Retail pads, office sites, and mixed-use parcels in high-traffic corridors.', icon: '🏢' },
  { title: 'Multifamily Pads', description: 'Entitled and unentitled multifamily sites for apartment and condo development.', icon: '🏗️' },
  { title: 'Industrial', description: 'Flex, warehouse, and distribution sites throughout Clark County.', icon: '🏭' },
]

export const LOT_TYPES = [
  'Residential – Single Family',
  'Residential – Townhome / Condo Pad',
  'Multifamily',
  'Commercial / Retail',
  'Industrial / Flex',
  'Mixed Use',
  'Raw / Unentitled Land',
  'Other',
]

export const BUDGET_RANGES = [
  'Under $500K',
  '$500K – $1M',
  '$1M – $3M',
  '$3M – $5M',
  '$5M – $10M',
  '$10M+',
]

export const ROLES = [
  { label: 'Developer', value: 'developer' },
  { label: 'Broker / Agent', value: 'broker' },
  { label: 'Investor', value: 'investor' },
  { label: 'Land Owner / Seller', value: 'seller' },
  { label: 'Other', value: 'other' },
]

export const INTEREST_OPTIONS = [
  { label: 'Looking to Buy', value: 'buy' },
  { label: 'Looking to Sell', value: 'sell' },
  { label: 'Both Buy & Sell', value: 'both' },
]

export const JURISDICTIONS = [
  {
    slug: 'clark-county',
    name: 'Clark County',
    gisUrl: 'https://maps.clarkcountynv.gov/openweb/',
    zoningUrl: 'https://www.clarkcountynv.gov/government/departments/comprehensive_planning_department/divisions/current_planning_division/',
    codeUrl: 'https://www.clarkcountynv.gov/government/departments/comprehensive_planning_department/divisions/current_planning_division/',
    logoSrc: '/images/resources/clark-county-logo.png',
    description: 'Clark County unincorporated areas, including Enterprise, Spring Valley, and the Strip corridor.',
    highlights: ['GISMO parcel search', 'Unified Development Code (UDC)', 'Enterprise and Spring Valley planning districts', 'Building permit portal'],
  },
  {
    slug: 'henderson',
    name: 'Henderson',
    gisUrl: 'https://cityofhenderson.com/residents/public-services/gis-mapping',
    zoningUrl: 'https://www.cityofhenderson.com/residents/public-services/planning-building/planning-zoning',
    codeUrl: 'https://www.cityofhenderson.com/residents/public-services/planning-building/development-code',
    logoSrc: '/images/resources/henderson-logo.png',
    description: "Henderson — the fastest-growing city in Nevada with significant master-planned community land.",
    highlights: ['Henderson GIS portal', 'Development Code & zoning map', 'Master plan areas', 'Permit center'],
  },
  {
    slug: 'north-las-vegas',
    name: 'North Las Vegas',
    gisUrl: 'https://gis.cityofnorthlasvegas.com/',
    zoningUrl: 'https://www.cityofnorthlasvegas.com/departments/community-development-and-compliance/planning-and-zoning',
    codeUrl: 'https://www.cityofnorthlasvegas.com/departments/community-development-and-compliance/planning-and-zoning/title-17-zoning-regulations',
    logoSrc: '/images/resources/north-las-vegas-logo.png',
    description: 'North Las Vegas — home to major industrial corridors and one of the highest growth rates in the valley.',
    highlights: ['NLV GIS viewer', 'Title 17 Zoning Regulations', 'Apex Industrial Area', 'Building & development permits'],
  },
  {
    slug: 'boulder-city',
    name: 'Boulder City',
    gisUrl: 'https://www.bcnv.org/302/Geographic-Information-System',
    zoningUrl: 'https://www.bcnv.org/229/Planning-Zoning',
    codeUrl: 'https://www.bcnv.org/229/Planning-Zoning',
    logoSrc: '/images/resources/boulder-city-logo.png',
    description: 'Boulder City — unique market with charter-protected land limits and historic district considerations.',
    highlights: ['BC GIS portal', 'Zoning ordinance', 'Historic preservation overlay', 'Land use approvals'],
  },
  {
    slug: 'las-vegas',
    name: 'City of Las Vegas',
    gisUrl: 'https://www.lasvegasnevada.gov/Government/City-Services/GIS-Mapping',
    zoningUrl: 'https://www.lasvegasnevada.gov/Government/Departments/Planning/Zoning',
    codeUrl: 'https://www.lasvegasnevada.gov/Government/Departments/Planning/Development-Code',
    logoSrc: '/images/resources/las-vegas-logo.png',
    description: 'City of Las Vegas proper — downtown core, arts district, and surrounding urban neighborhoods.',
    highlights: ['Las Vegas GIS viewer', 'Unified Development Code', 'Downtown & arts district maps', 'CityConnect permit portal'],
  },
]

export const CLOSED_SALES = [
  { id: 1, title: 'Highway 160 Blue Diamond Pad — 3.81 Acres', type: 'Commercial', size: '3.81 acres', location: 'Blue Diamond', imageSrc: '/images/lots/lot-1.jpg', gisUrl: 'https://maps.clarkcountynv.gov/ow/?@719200,26714393,7' },
  { id: 2, title: 'Henderson Multifamily Site — 1.8 Acres', type: 'Multifamily', size: '1.8 acres', location: 'Henderson', imageSrc: '/images/lots/lot-2.jpg', gisUrl: 'https://maps.clarkcountynv.gov/openweb/' },
  { id: 3, title: 'Enterprise Commercial Corner — 0.9 Acres', type: 'Commercial', size: '0.9 acres', location: 'Enterprise', imageSrc: '/images/lots/lot-3.jpg', gisUrl: 'https://maps.clarkcountynv.gov/openweb/' },
  { id: 4, title: 'Spring Valley Residential — 12 Lots', type: 'Residential', size: '12 lots', location: 'Spring Valley', imageSrc: '/images/lots/lot-4.jpg', gisUrl: 'https://maps.clarkcountynv.gov/openweb/' },
  { id: 5, title: 'NLV Retail Pad — 1.1 Acres', type: 'Commercial', size: '1.1 acres', location: 'North Las Vegas', imageSrc: '/images/lots/lot-5.jpg', gisUrl: 'https://maps.clarkcountynv.gov/openweb/' },
  { id: 6, title: 'Unincorporated Clark — 22 Acres Raw', type: 'Raw Land', size: '22 acres', location: 'Clark County', imageSrc: '/images/lots/lot-6.jpg', gisUrl: 'https://maps.clarkcountynv.gov/openweb/' },
  { id: 7, title: 'Downtown LV Mixed-Use Pad', type: 'Mixed Use', size: '0.6 acres', location: 'City of Las Vegas', imageSrc: '/images/lots/lot-7.jpg', gisUrl: 'https://maps.clarkcountynv.gov/openweb/' },
  { id: 8, title: 'Henderson Industrial — 8.3 Acres', type: 'Industrial', size: '8.3 acres', location: 'Henderson', imageSrc: '/images/lots/lot-8.jpg', gisUrl: 'https://maps.clarkcountynv.gov/openweb/' },
  { id: 9, title: 'NLV Flex / Warehouse Site', type: 'Industrial', size: '3.5 acres', location: 'North Las Vegas', imageSrc: '/images/lots/lot-9.jpg', gisUrl: 'https://maps.clarkcountynv.gov/openweb/' },
]

export const TEAM = [
  {
    name: 'Parker Gibbons',
    title: 'Founder & Land Broker',
    bio: 'Parker Gibbons has been buying, selling, and brokering land in the Las Vegas Valley for over 15 years. He built PaperLotLand to give developers and investors a direct, off-market channel to move land — without the delays and exposure of the public MLS.',
    imageSrc: '/images/team/parker-gibbons.jpg',
    linkedin: 'https://www.linkedin.com/in/the-parker-gibbons/',
  },
]

export const FOUNDER = {
  name: TEAM[0].name,
  title: TEAM[0].title,
  bio: TEAM[0].bio,
  imageSrc: TEAM[0].imageSrc,
  linkedin: TEAM[0].linkedin,
}

export const FAQ_ITEMS = [
  {
    question: 'What is PaperLotLand?',
    answer:
      'PaperLotLand is an off-market land network for the Las Vegas Valley. We connect developers, brokers, and investors with land deals that never hit the public market. We also maintain a resource library of GIS tools and zoning codes for every jurisdiction in Clark County.',
  },
  {
    question: 'How do I access off-market land deals?',
    answer:
      "Submit the join form with your name, email, phone, and what you're looking for. When a parcel matches your criteria, we reach out directly. All submissions are confidential — we do not share your contact information without permission.",
  },
  {
    question: 'What types of land does PaperLotLand work with?',
    answer:
      'We work with all land types in Clark County: residential lots (single-family, townhome pads, condo pads), multifamily sites, commercial and retail pads, industrial and flex land, mixed-use parcels, and raw or unentitled acreage.',
  },
  {
    question: 'Can I submit a land deal I want to sell?',
    answer:
      'Yes. If you own a parcel and want to explore an off-market sale — without listing it publicly — reach out via the contact form or call (702) 465-6111. We work with sellers directly and can move quickly on well-priced land.',
  },
  {
    question: 'What GIS resources are available on PaperLotLand?',
    answer:
      "We link directly to the official GIS portals for all five Clark County jurisdictions: Clark County GISMO, Henderson, North Las Vegas, Boulder City, and the City of Las Vegas. Each resource page also includes links to the jurisdiction's zoning code and development code.",
  },
  {
    question: 'What does the due diligence process look like for land in Las Vegas?',
    answer:
      "At minimum, buyers should pull the parcel from the Clark County Assessor, confirm zoning and allowed uses, check for CCRs or deed restrictions, review the preliminary title report, and run a utility availability check. For raw land, an environmental phase-one is standard. We can point you to the right resources for each step.",
  },
]

export const SOCIAL = {
  facebook: '',
  instagram: '',
  youtube: '',
  linkedin: '',
}

export const CITATIONS: string[] = []

export const GOOGLE_REVIEWS = {
  placeId: '',
  rating: '5.0',
  count: 0,
  url: '',
}

export const OFFICES = [
  {
    name: 'Las Vegas',
    city: 'Las Vegas',
    state: 'NV',
    phone: businessConfig.contact.phone,
    phoneDisplay: businessConfig.contact.phoneDisplay,
  },
]
export const BBB = { rating: '5.0', reviewCount: 0, url: '' }

export const DEFAULT_REVIEWER = {
  name: 'Parker Gibbons',
  role: 'Founder & Land Broker',
  image: '/images/team/parker-gibbons.jpg',
  url: undefined as string | undefined,
  license: undefined as string | undefined,
}

export const LAST_REVIEWED = new Date().toISOString().split('T')[0]
