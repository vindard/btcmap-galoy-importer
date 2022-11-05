import fs from "fs";
import axios from "axios";

const API_ENDPOINT = "https://api.mainnet.galoy.io/graphql/"
const defaultHeaders = {
  Accept: "application/json",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};
const galoyRequestsPath = "./src/services/galoy-requests"

const BusinessMapMarkersQuery = fs.readFileSync(`${galoyRequestsPath}/business-map-markers.gql`, "utf8")

const Galoy = () => {
  const fetchBusinessMapMarkers = async () => {
    const query = {
      query: BusinessMapMarkersQuery,
    };

    const {
      data: { data, errors },
    } = await axios.post(API_ENDPOINT, query, {
      headers: defaultHeaders,
    });

    return data.businessMapMarkers
  }

  return {
    fetchBusinessMapMarkers
  }
}

export default Galoy
