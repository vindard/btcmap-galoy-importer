import axios, { AxiosError, AxiosResponse } from "axios"

// API URL & HEADERS
// =====

const NEARBY_NODES_RADIUS = 0.00025
const COORD_PRECISION = 7

const OSM_URL = "https://api.openstreetmap.org/api/0.6"
// const OSM_URL = "https://master.apis.dev.openstreetmap.org/api/0.6"

const authHeader = ({
  username,
  password,
}: {
  username: string | undefined
  password: string | undefined
}) => {
  if (!(username && password)) {
    return {}
  }

  const creds = `${username}:${password}`
  const b64Creds = Buffer.from(creds).toString("base64")
  return { Authorization: `Basic ${b64Creds}` }
}

const { OSM_USERNAME: username, OSM_PASSWORD: password } = process.env
const defaultHeaders = {
  Accept: "application/json"
}
const defaultHeadersWithAuth = {
  ...defaultHeaders,
  ...authHeader({ username, password })
}

// TYPES, CONSTANTS & HELPERS
// =====

const coordRound = (coord: CoOrd): CoOrd => ({
  lat: Number(coord.lat.toFixed(COORD_PRECISION)),
  lon: Number(coord.lon.toFixed(COORD_PRECISION)),
})

const safeGet = async (
  endpoint: string,
): Promise<AxiosResponse<any, any> | AxiosError> => {
  try {
    const resp = await axios.get(OSM_URL + endpoint, {
      headers: defaultHeaders,
    })
    return resp
  } catch (err) {
    return err as AxiosError
  }
}

const safeGetWithAuth = async (
  endpoint: string,
): Promise<AxiosResponse<any, any> | AxiosError> => {
  try {
    const resp = await axios.get(OSM_URL + endpoint, {
      headers: defaultHeadersWithAuth,
    })
    return resp
  } catch (err) {
    return err as AxiosError
  }
}

const handleAxiosError = (err: AxiosError): void => {
  const response = err.response
  if (response) {
    // console.log(Object.keys(response))

    const { status, statusText } = response
    console.log(`${status}: ${statusText}`)

    switch (status) {
      case 401:
        console.log(`Authorization error occurred, checkover credentials`)
    }
  }
}

// OSM LOGIC
// =====

const OpenStreetMap = () => {
  const getBox = async (coords: { min: CoOrd; max: CoOrd }) => {
    const {
      min: { lat: bottom, lon: left },
      max: { lat: top, lon: right },
    } = coords
    const endpoint = `/map?bbox=${left},${bottom},${right},${top}`

    return safeGet(endpoint)
  }

  const checkPermissions = async () => {
    const endpoint = "/permissions"
    const resp = await safeGetWithAuth(endpoint)
    if (resp instanceof Error) return handleAxiosError(resp)

    console.log("Permissions check:")
    console.log(Object.keys(resp))
    console.log(resp.data)
    console.log("============\n")
  }

  const fetchNearbyNodes = async ({ coord, boxRadius = NEARBY_NODES_RADIUS }: { coord: CoOrd; boxRadius?: number }): Promise<OsmRawNode[] | Error> => {
    const { lat, lon } = coord
    const min = coordRound({ lat: lat - boxRadius, lon: lon - boxRadius })
    const max = coordRound({ lat: lat + boxRadius, lon: lon + boxRadius })
    const resp = await getBox({ min, max })
    if (resp instanceof Error) {
      handleAxiosError(resp)
      return resp
    }

    // console.log("MinMax:", { min, max })
    // console.log("Bounds:", resp.data.bounds)
    const inside = (node: OsmRawNode) => {
      const { lat, lon } = node
      return lat >= min.lat && lat <= max.lat && lon >= min.lon && lon <= max.lon
    }

    const filteredElements = resp.data.elements.filter(
      (node: OsmRawNode) => node.type === "node" && node.tags && !node.tags.highway,
    )
    const insideFilteredElems = filteredElements.filter((node: OsmRawNode) => inside(node))
    // const outsideFilteredElems = filteredElements.filter((node: OsmNode) => !inside(node))

    return insideFilteredElems
  }

  const fetchNode = async (nodeId: string) => {
    const endpoint = `/node/${nodeId}` // Agroveterinaria

    const resp = await safeGet(endpoint)
    if (resp instanceof Error) return handleAxiosError(resp)

    return resp.data
  }

  return {
    checkPermissions,
    fetchNode,
    fetchNearbyNodes,
  }
}

export default OpenStreetMap