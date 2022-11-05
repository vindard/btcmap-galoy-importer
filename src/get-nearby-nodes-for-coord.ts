import OpenStreetMap from "./services/osm"

const getNearbyNodesForCoOrd = async (coord: CoOrd): Promise<OsmNode[] | Error> => {
  const osm = await OpenStreetMap()
  if (osm instanceof Error) return osm

  const nearby = await osm.fetchNearbyNodes({ coord })
  if (nearby instanceof Error) return nearby

  return nearby.filter((node: OsmRawNode): node is OsmNode => !!node.tags?.name)
}

export default getNearbyNodesForCoOrd
