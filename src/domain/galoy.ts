export const coordFromMarker = (marker: GaloyMapMarker) => ({
  lat: marker.mapInfo.coordinates.latitude,
  lon: marker.mapInfo.coordinates.longitude,
})
