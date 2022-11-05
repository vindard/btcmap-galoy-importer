import OpenStreetMap from "./services/osm"

const osm = OpenStreetMap()

const getNearbyNodesForNode = async (nodeId: string): Promise<OsmRawNode[] | Error> => {
  const node = await osm.fetchNode(nodeId)
  if (node instanceof Error) return node

  const coord = node.elements[0]
  return osm.fetchNearbyNodes({ coord })
}

export default getNearbyNodesForNode
