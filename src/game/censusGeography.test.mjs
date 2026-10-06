import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CENSUS_DIVISIONS,
  CENSUS_REGIONS,
  CENSUS_STATE_GEOGRAPHY,
  statesInCensusGroup,
} from '../censusGeography.js';
import { POPULATION_2025, TOTAL_AREA_SQ_MI_2010 } from '../officialStateData.js';

test('official Census model contains 4 regions and 9 divisions', () => {
  assert.equal(Object.keys(CENSUS_REGIONS).length, 4);
  assert.equal(Object.keys(CENSUS_DIVISIONS).length, 9);
});

test('all 50 states have official Census geography and FIPS codes', () => {
  assert.equal(Object.keys(CENSUS_STATE_GEOGRAPHY).length, 50);
  for (const geography of Object.values(CENSUS_STATE_GEOGRAPHY)) {
    assert.ok(CENSUS_REGIONS[geography.region]);
    assert.ok(CENSUS_DIVISIONS[geography.division]);
    assert.equal(CENSUS_DIVISIONS[geography.division].region, geography.region);
    assert.match(geography.fips, /^\d{2}$/);
  }
});

test('Census classifications match official edge cases', () => {
  assert.deepEqual(CENSUS_STATE_GEOGRAPHY.Delaware, {
    fips: '10',
    region: 'South',
    division: 'South Atlantic',
  });
  assert.equal(CENSUS_STATE_GEOGRAPHY.Maryland.region, 'South');
  assert.equal(CENSUS_STATE_GEOGRAPHY.Alaska.division, 'Pacific');
  assert.equal(CENSUS_STATE_GEOGRAPHY.Hawaii.division, 'Pacific');
  assert.equal(CENSUS_STATE_GEOGRAPHY.Oklahoma.division, 'West South Central');
});

test('division membership is complete without duplicates', () => {
  const divisionStates = Object.keys(CENSUS_DIVISIONS).flatMap((division) =>
    statesInCensusGroup('division', division)
  );
  assert.equal(divisionStates.length, 50);
  assert.equal(new Set(divisionStates).size, 50);
});

test('official Census total-area layer contains all 50 states and fixes legacy land-area mixups', () => {
  assert.equal(Object.keys(TOTAL_AREA_SQ_MI_2010).length, 50);
  assert.equal(TOTAL_AREA_SQ_MI_2010.Delaware, 2489);
  assert.equal(TOTAL_AREA_SQ_MI_2010['Rhode Island'], 1545);
  assert.equal(TOTAL_AREA_SQ_MI_2010.Alaska, 665384);
});

test('Vintage 2025 population layer contains all 50 states', () => {
  assert.equal(Object.keys(POPULATION_2025).length, 50);
  assert.equal(POPULATION_2025.California, 39355309);
  assert.equal(POPULATION_2025.Texas, 31709821);
  assert.equal(POPULATION_2025.Wyoming, 588753);
});
