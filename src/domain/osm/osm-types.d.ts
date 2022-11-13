type CoOrd = { lat: number; lon: number }

type OsmRawNode = {
  type: string
  id: string
  visible: string
  version: string
  changeset: string
  user: string
  uid: string
  tags?: {
    [key: string]: string
  }
} & CoOrd

type OsmNewNode = {
  type: string
  id: "0"
  visible: string
  version: string
  changeset: string
  user: string
  uid: string
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
    visible: string
    version: string
    changeset: string
    user: string
    uid: string
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
  meta: { changeset: string; user: string; uid: string }
}

type MarkersToOsmChangeArgs = {
  markers: MarkerWithCompare[]
  meta: { changeset: string; user: string; uid: string }
}
