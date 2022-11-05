import compare from "./compare"
const COMPARE_THRESHOLD = 0.6

export const addComparesToMarker = (marker: Marker): MarkerWithCompare => {
  const { nearbyNodes: nearbyRaw, ...markerWithoutNearby } = marker
  const nearbyNodes = nearbyRaw || []

  const names = []
  for (const node of nearbyNodes) {
    const name = node.tags?.name || ""
    names.push(name)
  }

  const updatedNearbyNodes = []
  const skippedNearbyNodes = []
  if (names && names.length) {
    const result = compare(marker.mapInfo.title, names)
    for (const { item, score, refIndex: i } of result) {
      const node = {
        ...nearbyNodes[i],
        compare: { score, item }
      }
      if (score && (score <= COMPARE_THRESHOLD)) {
        updatedNearbyNodes.push(node)
      } else {
        skippedNearbyNodes.push(node)
      }
    }
  }

  const inconsistent = updatedNearbyNodes.length > 1

  return {
    ...markerWithoutNearby,
    matchedNearbyNodes: updatedNearbyNodes,
    skippedNearbyNodes,
    ...((inconsistent) ? { inconsistent } : {})
  }
}
