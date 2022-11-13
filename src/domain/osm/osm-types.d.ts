type CoOrd = { lat: number; lon: number }

type OsmRawNode = {
  type: string
  id: string
  version: string
  changeset: string
  tags?: {
    [key: string]: string
  }
} & CoOrd

type OsmNewNode = {
  type: string
  id: "-1"
  version: "1"
  changeset: string
  tags?: {
    [key: string]: string
  }
} & CoOrd

type OsmBtcMapNode = Omit<OsmRawNode, "tags"> & {
  tags: {
    name: string
    [key: string]: string
  }
}
type OsmNodeTag = { _attributes: { k: string; v: string } }

type OsmChangeNode = {
  _attributes: {
    id: string
    version: string
    changeset: string
    lat: string
    lon: string
  }
  tag: OsmNodeTag[]
}

type OsmChangeXml = string

type OsmChangeCreate = {}

type OsmChangeModify = {
  osmChange: {
    _attributes: {
      version: string
      copyright: string
      attribution: string
      license: string
    }
    modify: {
      node: OsmChangeNode[]
    }
  }
}

type MarkerToOsmChangeArgs = {
  marker: MarkerWithCompare
  changeset: string
}

type MarkersToOsmChangeArgs = {
  markers: MarkerWithCompare[]
  changeset: string
}
