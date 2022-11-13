import convert from "xml-js"
import axios, { AxiosError, AxiosResponse } from "axios"
import { COORD_PRECISION } from "../domain/osm"

const CREATED_BY = "Galoy Exporter"

// API URL & HEADERS
// =====

const NEARBY_NODES_RADIUS = 0.00025

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
  Accept: "application/json",
}
const defaultHeadersWithAuth = {
  ...defaultHeaders,
  ...authHeader({ username, password }),
}

const putHeaders = {
  ...defaultHeaders,
  ["Content-type"]: "text/xml",
}
const putHeadersWithAuth = {
  ...putHeaders,
  ...authHeader({ username, password }),
}

const postHeaders = putHeaders
const postHeadersWithAuth = putHeadersWithAuth

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

const safePutWithAuth = async ({
  endpoint,
  body,
}: {
  endpoint: string
  body: string
}): Promise<AxiosResponse<any, any> | AxiosError> => {
  try {
    const resp = await axios.put(OSM_URL + endpoint, body, {
      headers: putHeadersWithAuth,
    })
    return resp
  } catch (err) {
    return err as AxiosError
  }
}

const safePostWithAuth = async ({
  endpoint,
  body,
}: {
  endpoint: string
  body: string
}): Promise<AxiosResponse<any, any> | AxiosError> => {
  try {
    const resp = await axios.post(OSM_URL + endpoint, body, {
      headers: postHeadersWithAuth,
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

const expandObjToArray = (args: { [key: string]: string }) => {
  const res: { _attributes: { k: string; v: string } }[] = []
  for (const key of Object.keys(args)) {
    res.push({
      _attributes: {
        k: key,
        v: args[key],
      },
    })
  }

  return res
}

const openChangesetXml = ({
  comment,
  createdBy = CREATED_BY,
}: {
  comment: string
  createdBy?: string
}) => {
  const tag = expandObjToArray({ comment, created_by: createdBy })

  const jsonForXml = JSON.stringify({
    osm: {
      _attributes: { version: "0.6" },
      changeset: { tag },
    },
  })

  return convert.json2xml(jsonForXml, {
    compact: true,
    ignoreComment: true,
    spaces: 4,
  })
}

const OpenStreetMap = async () => {
  const userDetails = async () => {
    const endpoint = "/user/details"

    const resp = await safeGetWithAuth(endpoint)
    if (resp instanceof Error) {
      handleAxiosError(resp)
      return resp
    }

    return { status: resp.status, user: resp.data?.user }
  }
  const userDetailsResult = await userDetails()
  if (userDetailsResult instanceof Error) return userDetailsResult
  const { user } = userDetailsResult
  const loggedIn = !!user
  const username = loggedIn ? user?.display_name : undefined
  const uid = loggedIn ? user?.id : undefined

  const checkPermissions = async () => {
    const endpoint = "/permissions"
    const resp = await safeGetWithAuth(endpoint)
    if (resp instanceof Error) return handleAxiosError(resp)

    console.log("Permissions check:")
    console.log(Object.keys(resp))
    console.log(resp.data)
    console.log("============\n")
  }

  const getBox = async (coords: { min: CoOrd; max: CoOrd }) => {
    const {
      min: { lat: bottom, lon: left },
      max: { lat: top, lon: right },
    } = coords
    const endpoint = `/map?bbox=${left},${bottom},${right},${top}`

    return safeGet(endpoint)
  }

  const fetchNearbyNodes = async ({
    coord,
    boxRadius = NEARBY_NODES_RADIUS,
  }: {
    coord: CoOrd
    boxRadius?: number
  }): Promise<OsmRawNode[] | Error> => {
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
    const insideFilteredElems = filteredElements.filter((node: OsmRawNode) =>
      inside(node),
    )
    // const outsideFilteredElems = filteredElements.filter((node: OsmBtcMapNode) => !inside(node))

    return insideFilteredElems
  }

  const fetchNode = async (nodeId: string) => {
    const endpoint = `/node/${nodeId}` // Agroveterinaria

    const resp = await safeGet(endpoint)
    if (resp instanceof Error) return handleAxiosError(resp)

    return resp.data
  }

  const openChangeset = async (args: { comment: string }): Promise<string | Error> => {
    const endpoint = `/changeset/create`
    if (!(loggedIn && username && uid)) {
      return new Error("Not authenticated for method")
    }

    const resp = await safePutWithAuth({
      endpoint,
      body: openChangesetXml({ ...args }),
    })
    if (resp instanceof Error) {
      handleAxiosError(resp)
      return resp
    }

    const changesetId = resp.data

    return changesetId
  }

  const updateChangeset = async ({ id, body }: { id: string; body: string }) => {
    const endpoint = `/changeset/${id}/upload`

    const resp = await safePostWithAuth({ endpoint, body })
    if (resp instanceof Error) {
      handleAxiosError(resp)
      return resp
    }

    return resp.data
  }

  const closeChangeset = async (id: string) => {
    const endpoint = `/changeset/${id}/close`

    const resp = await safePutWithAuth({ endpoint, body: "" })
    if (resp instanceof Error) {
      handleAxiosError(resp)
      return resp
    }

    return resp.status
  }

  return {
    loggedIn,
    username,
    uid,

    checkPermissions,
    fetchNode,
    fetchNearbyNodes,
    openChangeset,
    updateChangeset,
    closeChangeset,
  }
}

export default OpenStreetMap
