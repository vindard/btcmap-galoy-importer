type Marker = GaloyMapMarker & {
  nearbyNodes: OsmNode[]
}

type OsdNodeWithCompare = OsmNode & {
  compare: {
    score: number | undefined
    item: string
  }
}

type MarkerWithCompare = Omit<Marker, "nearbyNodes"> & {
  matchedNearbyNodes: OsdNodeWithCompare[]
  skippedNearbyNodes: OsdNodeWithCompare[]
  inconsistent?: true
}
