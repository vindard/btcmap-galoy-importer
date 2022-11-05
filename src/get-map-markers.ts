import Galoy from "./services/galoy"

const getMapMarkers = async (): Promise<GaloyMapMarker[]> => Galoy().fetchBusinessMapMarkers()

export default getMapMarkers
