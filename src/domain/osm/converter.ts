import convert from "xml-js"
import { COORD_PRECISION } from "./constants"

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
        version: node.version,
        changeset: node.changeset,
        lat: node.lat.toFixed(COORD_PRECISION),
        lon: node.lon.toFixed(COORD_PRECISION),
      },
      tag: Object.keys(tags).map((tag) => ({
        _attributes: { k: tag, v: tags[tag] },
      })),
    }
  }

  const noNearbyMarkerToOsmRawNode = ({
    marker,
    changeset,
  }: {
    marker: MarkerWithCompare
    changeset: string
  }): OsmNewNode | Error => {
    if (marker.matchedNearbyNodes && marker.matchedNearbyNodes.length > 0) {
      return new IncorrectMarkerForOsmModify()
    }

    return {
      type: "node",
      id: "-1",
      version: "1",
      changeset,

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
    changeset,
  }: {
    marker: MarkerWithCompare
    changeset: string
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
    changeset,
  }: MarkerToOsmChangeArgs): OsmChangeNode | Error => {
    console.log("HERE 10:", marker.matchedNearbyNodes.length)
    if (marker.matchedNearbyNodes.length > 0) {
      return new ExistingMatchesFoundForNewNodeError()
    }

    const osmNewNode = noNearbyMarkerToOsmRawNode({ marker, changeset })
    // console.log("HERE 11:", osmNewNode)
    if (osmNewNode instanceof Error) return osmNewNode

    return rawNodeToOsmChangeNode(osmNewNode)
  }

  const markerToOsmChangeNodeModify = ({
    marker,
    changeset,
  }: MarkerToOsmChangeArgs): OsmChangeNode | Error => {
    if (marker.matchedNearbyNodes.length === 0) {
      return new NoExistingMatchesFoundForModifyError()
    }
    if (marker.matchedNearbyNodes.length > 1) {
      return new MultipleMatchesForMarkerError()
    }

    const osmNewNode = singleNearbyMarkerToOsmRawNode({ marker, changeset })
    // console.log("HERE 11:", osmNewNode)
    if (osmNewNode instanceof Error) return osmNewNode

    return rawNodeToOsmChangeNode(osmNewNode)
  }

  const markersToOsmChange = ({
    convertFn,
    markers,
    changeset,
  }: MarkersToOsmChangeArgs & {
    convertFn: (args: MarkerToOsmChangeArgs) => OsmChangeNode | Error
  }): OsmChangeXml => {
    const nodes = markers
      .map((marker) => convertFn({ marker, changeset }))
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
