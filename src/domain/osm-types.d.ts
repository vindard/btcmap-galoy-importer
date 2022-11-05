type CoOrd = { lat: number; lon: number }

type OsmRawNode = {
  type: string
  tags?: {
    [key: string]: string
  }
} & CoOrd

type OsmNode = {
  type: string
  tags: {
    name: string
    [key: string]: string
  }
} & CoOrd
