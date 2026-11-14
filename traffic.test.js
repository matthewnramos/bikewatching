import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTrip, indexTrips, filterByMinute, stationTraffic, formatTime } from './traffic.js';

const trip = (start, end, from = 'A', to = 'B') => parseTrip({
  started_at: `2024-03-01 ${start}:00`, ended_at: `2024-03-02 ${end}:00`,
  start_station_id: from, end_station_id: to,
});

test('a midnight window includes late-night departures and early-morning arrivals', () => {
  const late = trip('23:30', '00:10');
  const early = trip('00:45', '01:05');
  const outside = trip('22:59', '01:01');
  const index = indexTrips([late, early, outside]);
  assert.deepEqual(new Set(filterByMinute(index.departures, 0)), new Set([late, early]));
  assert.deepEqual(filterByMinute(index.arrivals, 0), [late]);
  assert.deepEqual(filterByMinute(index.departures, 1440), filterByMinute(index.departures, 0));
});

test('the time window includes both hour boundaries and excludes the next minute', () => {
  const first = trip('07:00', '08:00');
  const last = trip('09:00', '10:00');
  const before = trip('06:59', '07:00');
  const after = trip('09:01', '10:00');
  const rides = [first, last, before, after];
  const index = indexTrips(rides);
  assert.deepEqual(new Set(filterByMinute(index.departures, 480)), new Set([first, last]));
  assert.equal(filterByMinute(index.departures, -1).length, rides.length);
  assert.equal(filterByMinute(index.arrivals, -1).length, rides.length);
});

test('arrival and departure station IDs remain distinct, including absent stations', () => {
  const metadata = [{ short_name: 'A', name: 'Alpha' }, { short_name: 'B', name: 'Beta' }, { short_name: 'C', name: 'Empty' }];
  const traffic = stationTraffic(metadata, new Map([['A', 5], ['B', 2]]), new Map([['A', 1], ['B', 7], ['missing', 3]]));
  assert.deepEqual(traffic.map(row => [row.departures, row.arrivals, row.totalTraffic]), [[5, 1, 6], [2, 7, 9], [0, 0, 0]]);
  assert.equal(metadata[0].totalTraffic, undefined);
});

test('noon and both midnight slider endpoints have unambiguous labels', () => {
  assert.equal(formatTime(0), '12:00 AM');
  assert.equal(formatTime(720), '12:00 PM');
  assert.equal(formatTime(1439), '11:59 PM');
  assert.equal(formatTime(1440), '12:00 AM');
});

test('invalid ride timestamps report a data error', () => {
  assert.throws(() => parseTrip({ started_at: 'invalid', ended_at: 'invalid' }), /invalid timestamp/);
});
