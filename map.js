import { MAPBOX_ACCESS_TOKEN } from './config.js';
import { parseTrip, indexTrips, filterByMinute, stationTraffic, formatTime } from './traffic.js';

const slider = document.querySelector('#time-slider');
const status = document.querySelector('#status');
const mapContainer = document.querySelector('#map');
const selectedTime = document.querySelector('#selected-time');
const anyTimeLabel = document.querySelector('#any-time');
const anyTimeButton = document.querySelector('#any-time-button');
const resetButton = document.querySelector('#reset-map');
const tooltip = document.querySelector('#station-tooltip');
const retryButton = document.querySelector('#retry');
const initialView = { center: [-71.09415, 42.36027], zoom: 12, bearing: 0, pitch: 0 };
let d3;
let map;
let circles;
let stations = [];
let trafficIndex;
let allTraffic;
let radiusScale;
let pinnedId = null;
let hoveredId = null;
let lastPointer = null;
let stationFlow;

function computeStationTraffic(timeFilter = -1) {
  if (timeFilter === -1) return allTraffic;
  const departures = d3.rollup(filterByMinute(trafficIndex.departures, timeFilter), rows => rows.length, row => row.start_station_id);
  const arrivals = d3.rollup(filterByMinute(trafficIndex.arrivals, timeFilter), rows => rows.length, row => row.end_station_id);
  return stationTraffic(stations, departures, arrivals);
}

function flowLabel(station) {
  if (!station.totalTraffic) return 'No traffic in this time window';
  const level = stationFlow(station.departures / station.totalTraffic);
  return level === 1 ? 'More departures' : level === 0 ? 'More arrivals' : 'Balanced arrivals and departures';
}

function tooltipText(station) {
  return `${station.name}: ${station.totalTraffic.toLocaleString('en-US')} total trips (${station.departures.toLocaleString('en-US')} departures, ${station.arrivals.toLocaleString('en-US')} arrivals). ${flowLabel(station)}.`;
}

function positionTooltip(event) {
  if (event && 'clientX' in event && event.clientX !== 0) {
    lastPointer = { x: event.clientX, y: event.clientY };
  } else if (event?.currentTarget) {
    const box = event.currentTarget.getBoundingClientRect();
    lastPointer = { x: box.right, y: box.top };
  }
  if (!lastPointer) return;
  const { width, height } = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.max(8, Math.min(lastPointer.x + 14, innerWidth - width - 8))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(lastPointer.y + 14, innerHeight - height - 8))}px`;
}

function showStation(station, event) {
  document.querySelector('#station-name').textContent = station.name;
  document.querySelector('#station-flow').textContent = flowLabel(station);
  document.querySelector('#station-total').textContent = station.totalTraffic.toLocaleString('en-US');
  document.querySelector('#station-departures').textContent = station.departures.toLocaleString('en-US');
  document.querySelector('#station-arrivals').textContent = station.arrivals.toLocaleString('en-US');
  tooltip.hidden = false;
  positionTooltip(event);
}

function clearStation() {
  pinnedId = null;
  hoveredId = null;
  tooltip.hidden = true;
  circles?.classed('pinned', false).attr('aria-pressed', 'false');
}

function updatePositions() {
  if (!circles) return;
  const width = mapContainer.clientWidth;
  const height = mapContainer.clientHeight;
  circles.each(function(station) {
    const point = map.project([station.lon, station.lat]);
    const visible = station.totalTraffic > 0 && point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;
    d3.select(this).attr('cx', point.x).attr('cy', point.y)
      .attr('visibility', visible ? 'visible' : 'hidden')
      .attr('tabindex', visible ? 0 : -1);
  });
}

function updateScatterPlot() {
  const minute = Number(slider.value);
  const filtered = computeStationTraffic(minute);
  radiusScale.range(minute === -1 ? [0, 25] : [0, 50]);
  const anyTime = minute === -1;
  selectedTime.hidden = anyTime;
  anyTimeLabel.hidden = !anyTime;
  selectedTime.textContent = anyTime ? '' : formatTime(minute);
  selectedTime.dateTime = anyTime ? '' : `${String(Math.floor((minute % 1440) / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  slider.setAttribute('aria-valuetext', anyTime ? 'Any time' : `${formatTime(minute)}, within one hour`);
  anyTimeButton.disabled = anyTime;

  circles = d3.select('#station-overlay').selectAll('circle')
    .data(d3.sort(filtered, station => -station.totalTraffic), station => station.short_name)
    .join(enter => enter.append('circle').attr('class', 'station-circle')
      .attr('role', 'button')
      .on('mouseenter focus', (event, station) => {
        hoveredId = station.short_name;
        if (!pinnedId) showStation(station, event);
      })
      .on('mousemove', event => { if (!pinnedId) positionTooltip(event); })
      .on('mouseleave blur', () => {
        hoveredId = null;
        if (!pinnedId) tooltip.hidden = true;
      })
      .on('click', (event, station) => {
        const wasPinned = pinnedId === station.short_name;
        clearStation();
        if (!wasPinned) {
          pinnedId = station.short_name;
          showStation(station, event);
          circles.classed('pinned', row => row.short_name === pinnedId)
            .attr('aria-pressed', row => String(row.short_name === pinnedId));
        }
      })
      .on('keydown', (event, station) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      }))
    .order()
    .attr('r', station => radiusScale(station.totalTraffic))
    .style('--departure-ratio', station => stationFlow(station.totalTraffic ? station.departures / station.totalTraffic : 0.5))
    .attr('aria-label', tooltipText)
    .attr('aria-pressed', station => String(station.short_name === pinnedId))
    .classed('pinned', station => station.short_name === pinnedId);
  circles.selectAll('title').data(station => [station]).join('title').text(tooltipText);
  const active = filtered.find(station => station.short_name === (pinnedId || hoveredId));
  if (active?.totalTraffic) showStation(active);
  else clearStation();
  updatePositions();
  const activeCount = filtered.filter(station => station.totalTraffic > 0).length;
  status.textContent = activeCount
    ? `${activeCount.toLocaleString('en-US')} stations with traffic${anyTime ? ' across the full month' : ` near ${formatTime(minute)}`}.`
    : 'No station traffic in this time window. Try another time or choose Any time.';
}

slider.addEventListener('input', updateScatterPlot);
anyTimeButton.addEventListener('click', () => {
  slider.value = -1;
  clearStation();
  updateScatterPlot();
});
resetButton.addEventListener('click', () => {
  clearStation();
  map.jumpTo(initialView);
});
retryButton.addEventListener('click', () => location.reload());
document.addEventListener('keydown', event => { if (event.key === 'Escape') clearStation(); });
window.addEventListener('scroll', () => { if (!pinnedId) tooltip.hidden = true; else positionTooltip(); }, { passive: true });

try {
  if (!MAPBOX_ACCESS_TOKEN.startsWith('pk.')) throw new Error('A Mapbox public access token is required in config.js.');
  const libraries = await Promise.all([
    import('https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm'),
    import('https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm'),
  ]);
  d3 = libraries[0];
  stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);
  const mapboxgl = libraries[1].default;
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
  map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/light-v11', ...initialView, minZoom: 5, maxZoom: 18 });
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  const overlay = d3.select(mapContainer).append('svg').attr('id', 'station-overlay')
    .attr('class', 'station-overlay').attr('role', 'group').attr('aria-label', 'Bluebikes station traffic');
  map.on('move', updatePositions);
  map.on('resize', updatePositions);
  map.on('movestart', clearStation);

  const mapReady = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('The map did not load. Check the network connection and Mapbox token.')), 45000);
    const failed = event => { clearTimeout(timeout); reject(event.error); };
    map.once('error', failed);
    map.once('load', () => {
      clearTimeout(timeout);
      map.off('error', failed);
      resolve();
    });
  });
  const [, stationJSON, trips, bostonLanes, cambridgeLanes] = await Promise.all([
    mapReady,
    d3.json(new URL('assets/bluebikes-stations.json', import.meta.url)),
    d3.csv(new URL('assets/bluebikes-traffic-2024-03.csv', import.meta.url), parseTrip),
    d3.json(new URL('assets/boston-bike-lanes.geojson', import.meta.url)),
    d3.json(new URL('assets/cambridge-bike-lanes.geojson', import.meta.url)),
  ]);
  stations = stationJSON.data.stations.filter(station => Number.isFinite(+station.lon) && Number.isFinite(+station.lat))
    .map(station => ({ ...station, lon: +station.lon, lat: +station.lat }));
  if (!stations.length || !trips.length) throw new Error('EMPTY_DATA');
  for (const [city, lanes] of [['boston', bostonLanes], ['cambridge', cambridgeLanes]]) {
    map.addSource(`${city}-bike-lanes`, { type: 'geojson', data: lanes });
    map.addLayer({
      id: `${city}-bike-lanes`, type: 'line', source: `${city}-bike-lanes`,
      paint: { 'line-color': '#15803d', 'line-width': 2.5, 'line-opacity': 0.6 },
    });
  }
  trafficIndex = indexTrips(trips);
  allTraffic = stationTraffic(stations,
    d3.rollup(trips, rows => rows.length, row => row.start_station_id),
    d3.rollup(trips, rows => rows.length, row => row.end_station_id));
  radiusScale = d3.scaleSqrt().domain([0, d3.max(allTraffic, station => station.totalTraffic) || 1]);
  circles = overlay.selectAll('circle');
  slider.disabled = false;
  resetButton.disabled = false;
  updateScatterPlot();
} catch (error) {
  status.textContent = 'The bike map could not load. Please check your connection and try again.';
  if (error.message === 'EMPTY_DATA') status.textContent = 'No station or ride data is available for this map yet.';
  if (!MAPBOX_ACCESS_TOKEN) status.textContent = 'The map is waiting for its Mapbox public access token.';
  retryButton.hidden = false;
  console.error('Unable to load Bikewatching:', error);
} finally {
  mapContainer.setAttribute('aria-busy', 'false');
}
