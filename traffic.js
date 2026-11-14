export function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function parseTrip(row) {
  const started_at = new Date(row.started_at.replace(' ', 'T'));
  const ended_at = new Date(row.ended_at.replace(' ', 'T'));
  if (Number.isNaN(+started_at) || Number.isNaN(+ended_at)) {
    throw new Error('A ride has an invalid timestamp.');
  }
  return {
    start_station_id: row.start_station_id,
    end_station_id: row.end_station_id,
    started_at,
    ended_at,
  };
}

export function indexTrips(trips) {
  const departures = Array.from({ length: 1440 }, () => []);
  const arrivals = Array.from({ length: 1440 }, () => []);
  for (const trip of trips) {
    departures[minutesSinceMidnight(trip.started_at)].push(trip);
    arrivals[minutesSinceMidnight(trip.ended_at)].push(trip);
  }
  return { departures, arrivals };
}

export function filterByMinute(buckets, minute) {
  if (minute === -1) return buckets.flat();
  const selected = [];
  // Include both endpoints of the one-hour window, wrapping across midnight.
  for (let offset = -60; offset <= 60; offset++) {
    selected.push(...buckets[((minute + offset) % 1440 + 1440) % 1440]);
  }
  return selected;
}

export function stationTraffic(stations, departures, arrivals) {
  return stations.map(station => {
    const stationDepartures = departures.get(station.short_name) ?? 0;
    const stationArrivals = arrivals.get(station.short_name) ?? 0;
    return {
      ...station,
      departures: stationDepartures,
      arrivals: stationArrivals,
      totalTraffic: stationDepartures + stationArrivals,
    };
  });
}

export function formatTime(minute) {
  const normalized = ((minute % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  return `${hours % 12 || 12}:${String(normalized % 60).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}
