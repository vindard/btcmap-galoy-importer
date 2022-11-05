import OpenStreetMap from "./services/osm"

const getNearbyNodesForNode = async (nodeId: string): Promise<OsmRawNode[] | Error> => {
  const osm = await OpenStreetMap()
  if (osm instanceof Error) return osm

  const node = await osm.fetchNode(nodeId)
  if (node instanceof Error) return node

  const coord = node.elements[0]
  return osm.fetchNearbyNodes({ coord })
}

export default getNearbyNodesForNode
