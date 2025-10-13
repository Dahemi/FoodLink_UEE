export const DirectionsApi = {
  /**
   * Get directions from origin -> destination via Google Directions API.
   * Returns { coordinates: {latitude,longitude}[], distanceText, durationText }.
   * Requires EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in env.
   */
  async getDirections(origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!key) throw new Error('Google Maps API key not configured (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)');
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&key=${encodeURIComponent(key)}&mode=driving`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Directions request failed (${res.status})`);
    const json = await res.json();
    if (!json.routes || json.routes.length === 0) throw new Error('No route found');
    const route = json.routes[0];
    const overview = route.overview_polyline?.points || '';
    const coords = decodePolyline(overview);
    const leg = (route.legs && route.legs[0]) || null;
    return {
      coordinates: coords,
      distanceText: leg?.distance?.text || '',
      durationText: leg?.duration?.text || '',
      raw: json,
    };
  }
};

/** Decode an encoded polyline (Google) into array of {latitude, longitude} */
function decodePolyline(str: string) {
  if (!str) return [];
  let index = 0, lat = 0, lng = 0, coords: { latitude: number; longitude: number }[] = [];
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}