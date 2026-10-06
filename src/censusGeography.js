// Canonical U.S. Census Bureau region/division classification for the 50 states.
// Source: Census Regions and Divisions of the United States.
// https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf

export const CENSUS_GEOGRAPHY_SOURCE = {
  agency: 'U.S. Census Bureau',
  title: 'Census Regions and Divisions of the United States',
  url: 'https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf',
  note: 'Four Census regions and nine Census divisions. Prior to June 1984, the Midwest Region was designated the North Central Region.',
};

export const CENSUS_REGIONS = {
  Northeast: { code: 1, divisions: ['New England', 'Middle Atlantic'] },
  Midwest: { code: 2, divisions: ['East North Central', 'West North Central'] },
  South: { code: 3, divisions: ['South Atlantic', 'East South Central', 'West South Central'] },
  West: { code: 4, divisions: ['Mountain', 'Pacific'] },
};

export const CENSUS_DIVISIONS = {
  'New England': { code: 1, region: 'Northeast' },
  'Middle Atlantic': { code: 2, region: 'Northeast' },
  'East North Central': { code: 3, region: 'Midwest' },
  'West North Central': { code: 4, region: 'Midwest' },
  'South Atlantic': { code: 5, region: 'South' },
  'East South Central': { code: 6, region: 'South' },
  'West South Central': { code: 7, region: 'South' },
  Mountain: { code: 8, region: 'West' },
  Pacific: { code: 9, region: 'West' },
};

export const CENSUS_STATE_GEOGRAPHY = {
  Alabama: { fips: '01', region: 'South', division: 'East South Central' },
  Alaska: { fips: '02', region: 'West', division: 'Pacific' },
  Arizona: { fips: '04', region: 'West', division: 'Mountain' },
  Arkansas: { fips: '05', region: 'South', division: 'West South Central' },
  California: { fips: '06', region: 'West', division: 'Pacific' },
  Colorado: { fips: '08', region: 'West', division: 'Mountain' },
  Connecticut: { fips: '09', region: 'Northeast', division: 'New England' },
  Delaware: { fips: '10', region: 'South', division: 'South Atlantic' },
  Florida: { fips: '12', region: 'South', division: 'South Atlantic' },
  Georgia: { fips: '13', region: 'South', division: 'South Atlantic' },
  Hawaii: { fips: '15', region: 'West', division: 'Pacific' },
  Idaho: { fips: '16', region: 'West', division: 'Mountain' },
  Illinois: { fips: '17', region: 'Midwest', division: 'East North Central' },
  Indiana: { fips: '18', region: 'Midwest', division: 'East North Central' },
  Iowa: { fips: '19', region: 'Midwest', division: 'West North Central' },
  Kansas: { fips: '20', region: 'Midwest', division: 'West North Central' },
  Kentucky: { fips: '21', region: 'South', division: 'East South Central' },
  Louisiana: { fips: '22', region: 'South', division: 'West South Central' },
  Maine: { fips: '23', region: 'Northeast', division: 'New England' },
  Maryland: { fips: '24', region: 'South', division: 'South Atlantic' },
  Massachusetts: { fips: '25', region: 'Northeast', division: 'New England' },
  Michigan: { fips: '26', region: 'Midwest', division: 'East North Central' },
  Minnesota: { fips: '27', region: 'Midwest', division: 'West North Central' },
  Mississippi: { fips: '28', region: 'South', division: 'East South Central' },
  Missouri: { fips: '29', region: 'Midwest', division: 'West North Central' },
  Montana: { fips: '30', region: 'West', division: 'Mountain' },
  Nebraska: { fips: '31', region: 'Midwest', division: 'West North Central' },
  Nevada: { fips: '32', region: 'West', division: 'Mountain' },
  'New Hampshire': { fips: '33', region: 'Northeast', division: 'New England' },
  'New Jersey': { fips: '34', region: 'Northeast', division: 'Middle Atlantic' },
  'New Mexico': { fips: '35', region: 'West', division: 'Mountain' },
  'New York': { fips: '36', region: 'Northeast', division: 'Middle Atlantic' },
  'North Carolina': { fips: '37', region: 'South', division: 'South Atlantic' },
  'North Dakota': { fips: '38', region: 'Midwest', division: 'West North Central' },
  Ohio: { fips: '39', region: 'Midwest', division: 'East North Central' },
  Oklahoma: { fips: '40', region: 'South', division: 'West South Central' },
  Oregon: { fips: '41', region: 'West', division: 'Pacific' },
  Pennsylvania: { fips: '42', region: 'Northeast', division: 'Middle Atlantic' },
  'Rhode Island': { fips: '44', region: 'Northeast', division: 'New England' },
  'South Carolina': { fips: '45', region: 'South', division: 'South Atlantic' },
  'South Dakota': { fips: '46', region: 'Midwest', division: 'West North Central' },
  Tennessee: { fips: '47', region: 'South', division: 'East South Central' },
  Texas: { fips: '48', region: 'South', division: 'West South Central' },
  Utah: { fips: '49', region: 'West', division: 'Mountain' },
  Vermont: { fips: '50', region: 'Northeast', division: 'New England' },
  Virginia: { fips: '51', region: 'South', division: 'South Atlantic' },
  Washington: { fips: '53', region: 'West', division: 'Pacific' },
  'West Virginia': { fips: '54', region: 'South', division: 'South Atlantic' },
  Wisconsin: { fips: '55', region: 'Midwest', division: 'East North Central' },
  Wyoming: { fips: '56', region: 'West', division: 'Mountain' },
};

export function getCensusGeography(stateName) {
  return CENSUS_STATE_GEOGRAPHY[stateName] || null;
}

export function statesInCensusGroup(groupType, groupName) {
  if (!['region', 'division'].includes(groupType)) return [];
  return Object.entries(CENSUS_STATE_GEOGRAPHY)
    .filter(([, geography]) => geography[groupType] === groupName)
    .map(([state]) => state);
}
