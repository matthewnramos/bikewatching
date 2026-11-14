# Lab 7 verification

## Data and filtering

- PASS: All 261,687 ride records parse successfully; the station file contains 453 unique `short_name` IDs.
- PASS: Independent Python calculations and the JavaScript bucket implementation agree for all-day, 8 AM, 6 PM, and midnight windows. Both slider endpoints 0 and 1440 represent midnight.
- PASS: Full-month traffic covers 414 stations, with 250,444 matched departures and 249,975 matched arrivals. Unmatched station IDs are documented in the README.
- PASS: At 8 AM the browser shows 385 stations, and MIT at Mass Ave / Amherst St shows 800 events: 253 departures and 547 arrivals, classified as more arrivals. At midnight it shows 362 stations and MIT has 233 events: 132 departures and 101 arrivals.
- PASS: Five Node tests cover inclusive time boundaries, midnight wrapping, independent arrival and departure joins, zero-traffic stations, time formatting, and invalid timestamps.

## Browser interactions

- PASS: The Mapbox light basemap loads with the supplied public browser token. Boston and Cambridge bike-lane layers render, and D3 station circles overlay the map.
- PASS: Zoom in/out and dragging change the map while station markers stay aligned. Reset map restores the initial view.
- PASS: The time slider changes counts, circle radii, and flow colors. Arrow keys adjust the selected minute. Any time restores the full month.
- PASS: Clicking a station opens and pins the detail. Space toggles pinning, Enter activates it, and Escape clears it. Hover and keyboard focus also expose station details.
- PASS: The 390px mobile view stacks the header and controls, wraps the legend, and fits within the page width. Tapping the MIT marker exposes its full-month total of 11,174 events, with 5,614 departures and 5,560 arrivals.
- PASS: A separate local test server simulated empty and missing ride data. The empty-data message and missing-data recovery message appeared, Retry loading reloaded the page, and returning to the normal data restored the map. These fixtures are not part of the published site.
- PASS: The normal map loaded without application errors in Chrome's console. Expected errors from the deliberate missing-data fixture were confined to that test page.

## Design delivery checks

- Hard gate PASS: Real public datasets, genuine portfolio/source links, no fabricated content, loading/empty/error states, labelled controls, visible focus, keyboard and mobile interactions checked. Page text contrast is at least 4.94:1; tooltip text is at least 7.58:1. The map reserves its height, and scripts load as modules.
- Purpose gate PASS: The light basemap supports reading the overlays; blue, middle-color, and orange encode traffic flow; green marks bike lanes; circle area encodes traffic; the tooltip shadow conveys elevation; short hover feedback respects reduced motion. No unrelated decoration or content sections were added.
- Liveliness PASS: Energy 1, rhythm 1, motion 1 follow the existing portfolio. The map is the focal point; system typography, blue links, and restrained spacing carry the portfolio's identity into this standalone project.
- Craftsmanship PASS: Script syntax, data calculations, edge-case tests, station details, filtering/reset controls, pan/zoom, mobile layout, and failure recovery were verified. Source files were edited directly. No measured performance score is claimed.
