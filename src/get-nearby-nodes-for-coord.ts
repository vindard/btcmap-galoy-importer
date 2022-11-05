import OpenStreetMap from "./services/osm"

const osm = OpenStreetMap()

const getNearbyNodesForCoOrd = async (coord: CoOrd): Promise<OsmNode[] | Error> => {
  const nearby = await osm.fetchNearbyNodes({ coord })
  if (nearby instanceof Error) return nearby

  return nearby.filter((node: OsmRawNode): node is OsmNode => !!node.tags?.name)
}

export default getNearbyNodesForCoOrd
