# Bikewatching

DSC 106 Lab 7: a Mapbox GL JS map of Bluebikes traffic in Boston and Cambridge during March 2024, with a D3 SVG station overlay.

## Run

1. Copy `config.example.js` to the ignored local file `config.js`. Set `MAPBOX_ACCESS_TOKEN` to your Mapbox **public** browser token, starting with `pk.`. Never use an `sk.` secret token.
2. Run `npm start` and open <http://127.0.0.1:8001/>.
3. Run `npm test` to check time-window boundaries, midnight wrapping, station joins, time labels, and invalid timestamps. No dependency installation is needed.

GitHub Pages publishes through `.github/workflows/pages.yml` on pushes to `main`. Configure the repository's `MAPBOX_PUBLIC_TOKEN` Actions secret and select GitHub Actions as the Pages source. `npm run build` generates `dist/config.js` from that secret in CI, or from the ignored local `config.js` when building locally. The token is a public browser credential and is necessarily present in the deployed site; it is not committed to the source repository. This project is separate from the portfolio repository.

## Interactions

- Drag the map to pan. Use the zoom buttons, mouse wheel, or trackpad to zoom. The compass restores north after rotation. Reset map restores the initial Boston/Cambridge view.
- Hover, focus, or tap a station to see its name, total traffic, departures, arrivals, and flow category. Clicking or pressing Enter/Space pins the detail. Escape clears it.
- Move the time slider to filter departures and arrivals independently to within 60 minutes of the chosen time. The window wraps across midnight. Both 0 and 1440 represent midnight.
- Any time restores the entire month. Circle areas show arrivals plus departures. Filtered circles use a larger radius range for readability, and zero-traffic stations are hidden.
- Blue means more departures, orange means more arrivals, and the middle color means balanced flow. The three categories divide the departure share into thirds. Green lines show bike facilities.

## Data

Local copies keep the public course data available without cross-origin dependencies. Map tiles and the D3/Mapbox libraries still need an internet connection.

- [Bluebikes station metadata](https://dsc106.com/labs/lab07/data/bluebikes-stations.json): 453 stations, joined to rides by `short_name`.
- [Bluebikes March 2024 rides](https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv): 261,687 rides.
- [Boston bike network](https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson): 3,166 features in the downloaded snapshot.
- [Cambridge bike facilities](https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson): 671 features in the downloaded snapshot.

The supplied station file does not contain every station ID used by the ride file. Matching records account for 250,444 departures and 249,975 arrivals across 414 active stations in the all-day view. Unmatched endpoints have no known location and are not plotted. Each ride can contribute a departure at its origin and an arrival at its destination; station traffic counts these endpoints, rather than distinct rides. Times are the Boston wall-clock times recorded in the CSV, consistently displayed without conversion to the viewer's time zone.

Rides are indexed into 1,440 departure and arrival buckets once. Slider updates inspect only the 121 inclusive minute buckets within the selected window. D3 rollups calculate counts by station; keyed joins reuse SVG circles; `map.project()` keeps markers aligned during pan, zoom, rotation, and resize. Smaller circles are drawn above larger ones.

## Design

An analytical map for portfolio visitors, following the portfolio's system typography, blue accent, restrained spacing, and simple borders. Energy 1, rhythm 1, motion 1. The map is the focal point. The light basemap separates labels and roads from colored station data. A separate swatch legend explains flow; green marks bike lanes. The tooltip shadow marks an elevated detail panel. Motion is limited to short hover feedback and respects reduced motion. Header controls stack on narrow screens; map controls have 44px touch targets.

## Submission

See [WALKTHROUGH.md](WALKTHROUGH.md) for a script and screen actions for a video under one minute. The [lab submission instructions](https://dsc106.com/labs/lab07/#submission) require presenting the map, demonstrating every required interaction, and explaining an interesting takeaway aloud in an MP4 screen recording.
