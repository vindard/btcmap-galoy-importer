type Marker = GaloyMapMarker & {
  nearbyNodes: OsmBtcMapNode[]
}

type OsmNodeWithCompare = OsmRawNode & {
  compare: {
    score: number | undefined
    item: string
  }
}

type MarkerWithCompare = Omit<Marker, "nearbyNodes"> & {
  matchedNearbyNodes: OsmNodeWithCompare[]
  skippedNearbyNodes: OsmNodeWithCompare[]
  inconsistent?: true
}
