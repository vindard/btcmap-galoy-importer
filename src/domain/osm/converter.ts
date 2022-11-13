import convert from "xml-js"

// Converter 'MarkerWithCompare' to OSM XML

// Conversions:
// 1. No matched nearby nodes
//   - new OsmRawNode from marker
//
// 2. Just 1 matched nearby node
//   - Add tags as needed to matched node as OSMRawNnode
//
// 3. More than 1 match node
//   - Figure some way to select correct node
//   - Add tags as needed to matched node as OSMRawNnode

class NoTagsForNodeError extends Error {}
class IncorrectMarkerForOsmModify extends Error {}
class ExistingMatchesFoundForNewNodeError extends Error {}
class NoExistingMatchesFoundForModifyError extends Error {}
class MultipleMatchesForMarkerError extends Error {}

export const OsmConverter = () => {
  const rawNodeToOsmChangeNode = (
    node: OsmNewNode | OsmRawNode,
  ): OsmChangeNode | Error => {
    if (!node.tags) return new NoTagsForNodeError()
    const { tags } = node

    return {
      _attributes: {
        id: node.id,
        visible: node.visible,
        version: node.version,
        changeset: node.changeset,
        user: node.user,
        uid: node.uid,
        lat: `${node.lat}`,
        lon: `${node.lon}`,
      },
      tag: Object.keys(tags).map((tag) => ({
        _attributes: { k: tag, v: tags[tag] },
      })),
    }
  }

  const noNearbyMarkerToOsmRawNode = ({
    marker,
    meta: { changeset, user, uid },
  }: {
    marker: MarkerWithCompare
    meta: { changeset: string; user: string; uid: string }
  }): OsmNewNode | Error => {
    if (marker.matchedNearbyNodes && marker.matchedNearbyNodes.length > 0) {
      return new IncorrectMarkerForOsmModify()
    }

    return {
      type: "node",
      id: "0",
      visible: "true",
      version: "0",
      changeset,
      user,
      uid,

      tags: {
        ["name"]: marker.mapInfo.title,
        ["currency:XBT"]: "yes",
        ["payment:lightning"]: "yes",
        ["payment:onchain"]: "yes",
        ["bitcoin_bank:galoy:bitcoin_beach"]: "yes",
      },

      lat: marker.mapInfo.coordinates.latitude,
      lon: marker.mapInfo.coordinates.longitude,
    }
  }

  const singleNearbyMarkerToOsmRawNode = ({
    marker,
    meta: { changeset, user, uid },
  }: {
    marker: MarkerWithCompare
    meta: { changeset: string; user: string; uid: string }
  }): OsmBtcMapNode | Error => {
    if (marker.matchedNearbyNodes && marker.matchedNearbyNodes.length !== 1) {
      return new IncorrectMarkerForOsmModify()
    }

    const { compare, ...node } = marker.matchedNearbyNodes[0]

    return {
      ...node,
      tags: {
        ...node.tags,
        ["name"]: marker.mapInfo.title,
        ["currency:XBT"]: "yes",
        ["payment:lightning"]: "yes",
        ["payment:onchain"]: "yes",
        ["bitcoin_bank:galoy:bitcoin_beach"]: "yes",
      },
    }
  }

  const markerToOsmChangeNodeCreate = ({
    marker,
    meta,
  }: {
    marker: MarkerWithCompare
    meta: { changeset: string; user: string; uid: string }
  }): OsmChangeNode | Error => {
    console.log("HERE 10:", marker.matchedNearbyNodes.length)
    if (marker.matchedNearbyNodes.length > 0) {
      return new ExistingMatchesFoundForNewNodeError()
    }

    const osmNewNode = noNearbyMarkerToOsmRawNode({ marker, meta })
    // console.log("HERE 11:", osmNewNode)
    if (osmNewNode instanceof Error) return osmNewNode

    return rawNodeToOsmChangeNode(osmNewNode)
  }

  const markerToOsmChangeNodeModify = ({
    marker,
    meta,
  }: MarkerToOsmChangeArgs): OsmChangeNode | Error => {
    if (marker.matchedNearbyNodes.length === 0) {
      return new NoExistingMatchesFoundForModifyError()
    }
    if (marker.matchedNearbyNodes.length > 1) {
      return new MultipleMatchesForMarkerError()
    }

    const osmNewNode = singleNearbyMarkerToOsmRawNode({ marker, meta })
    // console.log("HERE 11:", osmNewNode)
    if (osmNewNode instanceof Error) return osmNewNode

    return rawNodeToOsmChangeNode(osmNewNode)
  }

  const markersToOsmChange = ({
    convertFn,
    markers,
    meta,
  }: MarkersToOsmChangeArgs & {
    convertFn: (args: MarkerToOsmChangeArgs) => OsmChangeNode | Error
  }): OsmChangeXml => {
    const nodes = markers
      .map((marker) => convertFn({ marker, meta }))
      .filter((result) => !(result instanceof Error))

    console.log("HERE 0:", { markers: markers.length, nodes: nodes.length })
    const osmChangeNode = {
      osmChange: {
        _attributes: {
          version: "0.6",
          copyright: "OpenStreetMap and contributors",
          attribution: "http://www.openstreetmap.org/copyright",
          license: "http://opendatacommons.org/licenses/odbl/1-0/",
        },
        [convertFn === markerToOsmChangeNodeCreate ? "create" : "modify"]: {
          node: nodes,
        },
      },
    }

    return convert.json2xml(JSON.stringify(osmChangeNode), {
      compact: true,
      ignoreComment: true,
      spaces: 4,
    })
  }

  const markersToOsmCreate = (args: MarkersToOsmChangeArgs): OsmChangeXml =>
    markersToOsmChange({ convertFn: markerToOsmChangeNodeCreate, ...args })

  return {
    markersToOsmCreate: (args: MarkersToOsmChangeArgs): OsmChangeXml =>
      markersToOsmChange({ convertFn: markerToOsmChangeNodeCreate, ...args }),
    markersToOsmModify: (args: MarkersToOsmChangeArgs): OsmChangeXml =>
      markersToOsmChange({ convertFn: markerToOsmChangeNodeModify, ...args }),
  }
}
