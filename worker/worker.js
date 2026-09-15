const GOOGLE_PLACES = "https://places.googleapis.com/v1";
const GOOGLE_ROUTES = "https://routes.googleapis.com/directions/v2:computeRoutes";

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

async function googleFetch(url, apiKey, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), "X-Goog-Api-Key": apiKey }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google API ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response.json();
}

async function placeDetails(id, languageCode, apiKey) {
  return googleFetch(`${GOOGLE_PLACES}/places/${id}?languageCode=${languageCode}&regionCode=KR`, apiKey, {
    headers: { "X-Goog-FieldMask": "id,displayName,formattedAddress,location" }
  });
}

async function searchPlaces(query, apiKey) {
  const search = await googleFetch(`${GOOGLE_PLACES}/places:searchText`, apiKey, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location"
    },
    body: JSON.stringify({ textQuery: `${query} 韓國`, languageCode: "zh-TW", regionCode: "KR", pageSize: 5 })
  });
  return Promise.all((search.places || []).slice(0, 5).map(async place => {
    const [ko, en] = await Promise.all([
      placeDetails(place.id, "ko", apiKey),
      placeDetails(place.id, "en", apiKey)
    ]);
    return {
      id: place.id,
      names: { zh: place.displayName?.text, ko: ko.displayName?.text, en: en.displayName?.text },
      address: place.formattedAddress,
      addressKo: ko.formattedAddress,
      location: place.location
    };
  }));
}

async function routeForLanguage(origin, destination, languageCode, apiKey) {
  return googleFetch(GOOGLE_ROUTES, apiKey, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-FieldMask": "routes.duration,routes.localizedValues.duration,routes.legs.steps.travelMode,routes.legs.steps.transitDetails"
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: "TRANSIT", languageCode, regionCode: "KR",
      transitPreferences: { allowedTravelModes: ["SUBWAY", "TRAIN"] }
    })
  });
}

function transitSteps(route) {
  return (route.routes?.[0]?.legs || []).flatMap(leg => leg.steps || []).filter(step => step.travelMode === "TRANSIT");
}

async function computeRoute(origin, destination, apiKey) {
  const [zhRoute, koRoute, enRoute] = await Promise.all([
    routeForLanguage(origin, destination, "zh-TW", apiKey),
    routeForLanguage(origin, destination, "ko", apiKey),
    routeForLanguage(origin, destination, "en", apiKey)
  ]);
  const zh = transitSteps(zhRoute), ko = transitSteps(koRoute), en = transitSteps(enRoute);
  return {
    durationText: zhRoute.routes?.[0]?.localizedValues?.duration?.text,
    steps: zh.map((step, index) => {
      const detail = step.transitDetails || {};
      const koDetail = ko[index]?.transitDetails || {};
      const enDetail = en[index]?.transitDetails || {};
      const line = detail.transitLine || {};
      return {
        departureStop: { zh: detail.stopDetails?.departureStop?.name, ko: koDetail.stopDetails?.departureStop?.name, en: enDetail.stopDetails?.departureStop?.name },
        arrivalStop: { zh: detail.stopDetails?.arrivalStop?.name, ko: koDetail.stopDetails?.arrivalStop?.name, en: enDetail.stopDetails?.arrivalStop?.name },
        lineName: line.name, lineShortName: line.nameShort,
        color: line.color || "#596761", stopCount: detail.stopCount
      };
    })
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://a0912976077.github.io";
    const requestOrigin = request.headers.get("origin") || allowedOrigin;
    const corsOrigin = requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin;
    if (request.method === "OPTIONS") return json({}, 204, corsOrigin);
    if (!env.GOOGLE_MAPS_API_KEY) return json({ error: "Server API key is not configured" }, 500, corsOrigin);
    try {
      if (url.pathname === "/api/places" && request.method === "GET") {
        const query = url.searchParams.get("q")?.trim();
        if (!query || query.length > 100) return json({ error: "Invalid query" }, 400, corsOrigin);
        return json({ places: await searchPlaces(query, env.GOOGLE_MAPS_API_KEY) }, 200, corsOrigin);
      }
      if (url.pathname === "/api/routes" && request.method === "POST") {
        const { origin, destination } = await request.json();
        if (![origin?.lat, origin?.lng, destination?.lat, destination?.lng].every(Number.isFinite)) {
          return json({ error: "Invalid coordinates" }, 400, corsOrigin);
        }
        return json(await computeRoute(origin, destination, env.GOOGLE_MAPS_API_KEY), 200, corsOrigin);
      }
      return json({ error: "Not found" }, 404, corsOrigin);
    } catch (error) {
      return json({ error: error.message }, 502, corsOrigin);
    }
  }
};
