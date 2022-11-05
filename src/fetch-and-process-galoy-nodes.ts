import fs from "fs"

import { coordFromMarker } from "./domain/galoy"
import { addComparesToMarker } from "./domain/marker"

import getMapMarkers from "./get-map-markers"
import getNearbyNodesForCoOrd from "./get-nearby-nodes-for-coord"

export const fetchAndProcessGaloyAndOsmNodes = async ({
  path,
  persist = true,
}: {
  path: string
  persist?: boolean
}): Promise<MarkerWithCompare[]> => {
  let persistedMarkers = []
  try {
    const rawJson = fs.readFileSync(path, "utf8")
    persistedMarkers = JSON.parse(rawJson)
  } catch (err) {
    // do nothing, assume file empty or doesn't exist
  }
  const persistedMarkersByUsername: { [key: string]: MarkerWithCompare } = {}
  for (const marker of persistedMarkers) {
    const { username } = marker
    persistedMarkersByUsername[username] = marker
  }

  // Get all map markers
  const mapMarkers = await getMapMarkers()
  if (mapMarkers instanceof Error) throw mapMarkers

  // For each marker, fetch nearby and add to mapMarkers
  const updatedMapMarkers = []
  for (const i in mapMarkers) {
    const marker = mapMarkers[i]
    const persistedMarker = persistedMarkersByUsername[marker.username]
    if (persistedMarker) {
      console.log(`Skipping fetch/write for existing marker for '${marker.username}'`)
      updatedMapMarkers.push(persistedMarkersByUsername[marker.username])
      continue
    }

    const coord = coordFromMarker(marker)
    const nearbyNodes = await getNearbyNodesForCoOrd(coord)
    if (nearbyNodes instanceof Error) continue
    const markerWithCompares = addComparesToMarker({ ...marker, nearbyNodes })
    console.log(
      `Marker at index ${i}, '${nearbyNodes.length}' nearby nodes sorted into ` +
        `'${markerWithCompares.matchedNearbyNodes.length}' matches and ` +
        `'${markerWithCompares.skippedNearbyNodes.length}' skips`,
    )

    updatedMapMarkers.push(markerWithCompares)

    if (persist) {
      // Write mapMarkers to disk
      const data = JSON.stringify(updatedMapMarkers, null, 2)
      fs.writeFileSync(path, data)
      console.log(`Data written to: ${path}`)
    }
  }

  if (persist) {
    // Final write mapMarkers to disk
    const data = JSON.stringify(updatedMapMarkers, null, 2)
    fs.writeFileSync(path, data)
    console.log(`Final data written to: ${path}`)
  }

  return updatedMapMarkers
}

export const fetchGaloyAndOsmNodes = async ({
  path,
  persist = true,
}: {
  path: string
  persist?: boolean
}): Promise<Marker[]> => {
  let persistedMarkers = []
  try {
    const rawJson = fs.readFileSync(path, "utf8")
    persistedMarkers = JSON.parse(rawJson)
  } catch (err) {
    // do nothing, assume file empty or doesn't exist
  }
  const persistedMarkersByUsername: { [key: string]: Marker } = {}
  for (const marker of persistedMarkers) {
    const { username } = marker
    persistedMarkersByUsername[username] = marker
  }

  // Get all map markers
  const mapMarkers = await getMapMarkers()
  if (mapMarkers instanceof Error) throw mapMarkers

  // For each marker, fetch nearby and add to mapMarkers
  const updatedMapMarkers = []
  for (const i in mapMarkers) {
    const marker = mapMarkers[i]
    const persistedMarker = persistedMarkersByUsername[marker.username]
    if (persistedMarker) {
      console.log(`Skipping fetch/write for existing marker for '${marker.username}'`)
      updatedMapMarkers.push(persistedMarkersByUsername[marker.username])
      continue
    }

    const coord = coordFromMarker(marker)
    const nearbyNodes = await getNearbyNodesForCoOrd(coord)
    if (nearbyNodes instanceof Error) continue

    console.log(`Marker at index ${i}, '${nearbyNodes.length}' nearby nodes`)

    updatedMapMarkers.push({ ...marker, nearbyNodes })

    if (persist) {
      // Write mapMarkers to disk
      const data = JSON.stringify(updatedMapMarkers, null, 2)
      fs.writeFileSync(path, data)
      console.log(`Data written to: ${path}`)
    }
  }

  if (persist) {
    // Final write mapMarkers to disk
    const data = JSON.stringify(updatedMapMarkers, null, 2)
    fs.writeFileSync(path, data)
    console.log(`Final data written to: ${path}`)
  }

  return updatedMapMarkers
}
