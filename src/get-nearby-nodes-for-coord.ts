import OpenStreetMap from "./services/osm"

const getNearbyNodesForCoOrd = async (coord: CoOrd): Promise<OsmBtcMapNode[] | Error> => {
  const osm = await OpenStreetMap()
  if (osm instanceof Error) return osm

  const nearby = await osm.fetchNearbyNodes({ coord })
  if (nearby instanceof Error) return nearby

  const filtered = nearby.filter(
    (node: OsmRawNode): node is OsmBtcMapNode => !!(node.tags && node.tags.name),
  )

  return filtered
}

export default getNearbyNodesForCoOrd
