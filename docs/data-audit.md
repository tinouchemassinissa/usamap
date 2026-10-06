# USA State Explorer — factual data audit

## Policy

Educational content must distinguish **verified facts**, **sourced-but-not-yet-individually-checked fields**, and **legacy content awaiting review**. A source link alone is not treated as proof that a particular value has been checked.

## 50-state audit status

| Field | Coverage | Status | Canonical source |
| --- | ---: | --- | --- |
| Census Region | 50/50 | Verified | U.S. Census Bureau Regions and Divisions reference |
| Census Division | 50/50 | Verified | U.S. Census Bureau Regions and Divisions reference |
| State FIPS | 50/50 | Verified | U.S. Census Bureau Regions and Divisions reference |
| Population | 50/50 | Verified | Census Vintage 2025 / QuickFacts |
| Total area | 50/50 | Verified | Census 2010 MAF/TIGER state area table |
| Capital | 50/50 | Existing dataset | Independent official-source audit still recommended |
| Statehood date | 50/50 | Existing dataset + official source path attached | Individual primary-source review in progress |
| Neighbor graph | 50/50 | Curated/tested | Geographic adjacency model; point-only Four Corners contacts excluded |
| Legacy fun fact | 50/50 | Quarantined | Not presented as verified |
| Nickname | 0/50 hard-coded | Source identified | Census State Facts for Students |
| State symbols | 0/50 hard-coded | Source identified | Census State Facts for Students |
| Featured landmark / federal place | 0/50 hard-coded | Source path attached | National Park Service state directories |

## Corrected quantitative issues found

The audit caught several legacy area values that were not Census total area or differed from the Census reference. Examples include:

- Delaware: old value 1,949 sq mi was land area; official total area is 2,489 sq mi.
- Rhode Island: old value 1,214 sq mi; official total area is 1,545 sq mi.
- Alaska: official total area is 665,384 sq mi.
- California: official total area is 163,695 sq mi.
- Hawaii: official total area is 10,932 sq mi.
- Maine: official total area is 35,380 sq mi.
- Michigan: official total area is 96,714 sq mi.
- Missouri: official total area is 69,707 sq mi.

All 50 states now use one consistent Census total-area definition.

## Canonical Census geography

The application uses four Census Regions and nine Census Divisions:

1. Northeast
   - New England
   - Middle Atlantic
2. Midwest
   - East North Central
   - West North Central
3. South
   - South Atlantic
   - East South Central
   - West South Central
4. West
   - Mountain
   - Pacific

The Census reference notes that the Midwest Region was designated the North Central Region before June 1984.

## Source registry

- Regions / Divisions / FIPS:
  https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf
- Population estimates / QuickFacts:
  https://www.census.gov/quickfacts/
- State total area:
  https://www.census.gov/geographies/reference-files/2010/geo/state-area.html
- State Facts for Students:
  https://www.census.gov/schools/statefacts/
- National Park Service:
  https://www.nps.gov/parks/
- National Archives — Cities and States:
  https://www.archives.gov/research/topics/cities-states.html

## Display rule

Until a qualitative state fact, nickname, symbol, or landmark is individually verified against its authoritative source, it must not be labeled as verified. Correct-answer feedback currently uses a generated, source-backed Census fact based on Region, Division, and Vintage 2025 population.
