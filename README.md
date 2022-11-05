# BTCMap.org Galoy Importer

This tool will be able to pull in the merchants map list of locations from a Galoy instance using the Galoy API. It will parse that imported list against nearby existing locations in OpenStreetMaps, and then create/edit OSM locations based on this parsing to add BTCMap tags.

This will eventually either be runnable either as a one-off exported or on a cronjob to keep OSM in sync with a given instance.

No special Galoy instance credentials are needed to run this since reading the merchants map list is an unauthenticated query.

## Running the project

Note, the project is still very much WIP (see below). These instructions are for playing with the work done so far.

- Add local `.env` file with your OSM creds

  ```bash
  export OSM_USERNAME="<your-username>"
  export OSM_PASSWORD="<your-password>"
  ```

- Install dependencies

  ```bash
  yarn install
  ```

- Edit the lines at the end of `index.ts` to choose the demo you'd like to run

- Run the selected demo
  ```bash
  yarn start
  ```

## WIP Status

This tool is still very much WIP. The below points are the progress and open TODOs so far to get it to a completed first version stage.

### Open questions

**OSM data**

- [x] shape of OSM data
- [x] understanding galoy mapping to osm
- [x] figure out btcmap.org tags, and come up with optional new tags to add to new data (e.g. alt sources like https://bitcointourists.com/Maps/El-Salvador)

**Nearby nodes**

- [x] try to identify closeby similar places (nearby nodes)

  - [x] Detect nearby nodes
  - [x] Try to identify potential duplicates / already existing

**OSM creating/editing**

- [x] figure out OSM auth
- [x] creating/editing via OSM api
- [x] using OSM api at scale (rate limits)

**Data quality**

- [ ] Manually review fetched & compared data for consistency/accuracy
      (inside `marker-and-nearby-with-compare.json`)

### Open TODOs

- [ ] Clean up changeset methods to be more generic
- [ ] Figure out JSON shape for xml data
- [ ] Map node marker data to xml changeset payloads via xml-js
