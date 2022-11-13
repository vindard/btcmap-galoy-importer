import fs from "fs"

import getNearbyNodesForNode from "./src/get-nearby-nodes-for-node"
import {
  fetchAndProcessGaloyAndOsmNodes,
  fetchGaloyAndOsmNodes,
} from "./src/fetch-and-process-galoy-nodes"
import assignComparesToNearbyFromFile from "./src/process-fetched-galoy-and-osm-nodes"
import OpenStreetMap from "./src/services/osm"
import { OsmConverter } from "./src/domain/osm/converter"

const osmDemo = async () => {
  // This function gives a simple demo of fetching an OSM node by its
  // id and then finding its nearby nodes.

  // NODE OPTIONS:
  // const nodeId = "1546620055" // Olas Permanentes
  // const nodeId = "6985705638" // Ohuay
  // const nodeId = "1647988191" // Palacio de la Pizza
  const nodeId = "9411506620" // Agroveterinaria
  const nearby = await getNearbyNodesForNode(nodeId)
  if (nearby instanceof Error) return nearby

  console.log(JSON.stringify(nearby, null, 2))
}

const converterDemo = (changeset: string) => {
  const converter = OsmConverter()

  const markersWithCompare = JSON.parse(
    fs.readFileSync(".vscode/marker-and-nearby-with-compare.json", "utf8"),
  )

  // const xml = converter.markersToOsmModify({
  const xml = converter.markersToOsmCreate({
    markers: markersWithCompare,
    meta: { user: "vindard", uid: "1234", changeset },
  })

  console.log(xml)
}

const main = async (demo: string) => {
  let body: string
  let changesetId

  const osm = await OpenStreetMap()
  if (osm instanceof Error) throw osm

  switch (demo) {
    case "osm":
      console.log("Running OSM demo...")
      await osmDemo()
      break

    case "assign-compares-demo":
      console.log("Running assign-compare-scores-to-fetched-data demo...")
      const srcPath = "./phased-marker-and-nearby.json"
      const destPath = "./phased-marker-and-nearby-with-compare.json"
      await fetchGaloyAndOsmNodes({ path: srcPath })
      assignComparesToNearbyFromFile({ srcPath, destPath })
      break

    case "nearby-markers-to-file":
      console.log("Running nearby-nodes-for-marker-to-file demo...")
      await fetchAndProcessGaloyAndOsmNodes({
        path: "./marker-and-nearby-with-compare.json",
      })
      break

    case "open-changeset":
      changesetId = await osm.openChangeset({
        comment: "Changing the bitcoin_bank tag again",
      })
      console.log({ changesetId })
      break

    case "update-changeset":
      body = fs.readFileSync("./.vscode/pana-change.xml", "utf8")
      await osm.updateChangeset({ id: "128525647", body })
      break

    case "close-changeset":
      changesetId = "128525647"
      await osm.closeChangeset(changesetId)
      break

    case "converter":
      changesetId = "128525647"
      await converterDemo(changesetId)
      break

    default:
      console.log("No valid demo selected")
  }
}

// main("osm");
// main("assign-compares-demo")
// main("nearby-markers-to-file");
// main("open-changeset")
// main("update-changeset");
// main("close-changeset")
main("converter")
