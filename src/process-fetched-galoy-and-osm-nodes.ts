import fs from "fs"

import { addComparesToMarker } from "./domain/marker"

const assignComparesToNearbyFromFile = ({ srcPath, destPath }: { srcPath: string, destPath: string }) => {

  let persistedMarkers: Marker[] = []
  try {
    const rawJson = fs.readFileSync(srcPath, 'utf8')
    persistedMarkers = JSON.parse(rawJson)
  } catch (err) {
    // do nothing, assume file empty or doesn't exist
  }
  if (!(persistedMarkers && persistedMarkers.length)) {
    console.log('Empty source file')
    return
  }

  const updatedMarkers: MarkerWithCompare[] = []
  for (const i in persistedMarkers) {
    console.log(`Marker at index ${i}`)
    const updatedMarker = addComparesToMarker(persistedMarkers[i])
    updatedMarkers.push(updatedMarker)

    // Write update mapMarkers to disk
    const data = JSON.stringify(updatedMarkers, null, 2);
    fs.writeFileSync(destPath, data)
    console.log(`Data written to: ${destPath}`);
  }
}

export default assignComparesToNearbyFromFile
