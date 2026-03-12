/**
 * Google Maps Tools — Places, Geocoding, Directions & Distance Matrix.
 *
 * Tools:
 *   1. maps_geocode          — Convert address to lat/lng coordinates
 *   2. maps_reverse_geocode  — Convert lat/lng to address
 *   3. maps_places_search    — Find nearby businesses via Places Text Search
 *   4. maps_place_details    — Get detailed business info by placeId
 *   5. maps_distance_matrix  — Calculate distances/travel times between origins & destinations
 *   6. maps_directions       — Get step-by-step directions between two points
 *
 * Requires: GOOGLE_MAPS_API_KEY
 * All tools use fetch() directly (no SDK). Timeout: 15 seconds.
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('googleMapsTools');

const MAPS_BASE = 'https://maps.googleapis.com/maps/api';

function getApiKey(): string {
  return process.env.GOOGLE_MAPS_API_KEY || '';
}

function isConfigured(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY;
}

const NOT_CONFIGURED_ERR = { error: 'Set GOOGLE_MAPS_API_KEY to use maps tools' };

/** Shared fetch helper for Google Maps APIs. */
async function mapsFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`Google Maps ${res.status}: ${errText.slice(0, 200)}`);
  }
  return res.json() as T;
}

// ── Type definitions for API responses ──

interface GeocodingResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  place_id: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface PlaceResult {
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  place_id: string;
  types?: string[];
  geometry: { location: { lat: number; lng: number } };
}

interface PlaceDetailsResult {
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    relative_time_description: string;
  }>;
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  price_level?: number;
}

interface DistanceMatrixElement {
  distance?: { text: string; value: number };
  duration?: { text: string; value: number };
  duration_in_traffic?: { text: string; value: number };
  status: string;
}

interface DirectionsStep {
  html_instructions: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  travel_mode: string;
}

interface DirectionsLeg {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  duration_in_traffic?: { text: string; value: number };
  steps: DirectionsStep[];
}

interface DirectionsRoute {
  legs: DirectionsLeg[];
  overview_polyline: { points: string };
}

// ── Helper: extract address component by type ──
function extractComponent(components: GeocodingResult['address_components'], type: string): string {
  const match = components.find(c => c.types.includes(type));
  return match?.long_name || '';
}

export function getAllGoogleMapsTools(): ToolSchema[] {
  return [
    // ── 1. Geocode ──
    {
      name: 'maps_geocode',
      description: 'Convert an address to lat/lng coordinates using Google Geocoding API.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Address to geocode (e.g., "Via Argentina, Panama City")' },
        },
        required: ['address'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) return NOT_CONFIGURED_ERR;
        try {
          const address = encodeURIComponent(String(args.address));
          const url = `${MAPS_BASE}/geocode/json?address=${address}&key=${getApiKey()}`;
          const data = await mapsFetch<{ status: string; results: GeocodingResult[] }>(url);

          if (data.status !== 'OK' || !data.results.length) {
            return { error: `Geocoding failed: ${data.status}. No results for "${args.address}".` };
          }

          const result = data.results[0];
          log.info('maps_geocode', { address: args.address, placeId: result.place_id, trace_id: traceId });
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address,
            placeId: result.place_id,
          };
        } catch (err) {
          return { error: `Geocoding failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. Reverse Geocode ──
    {
      name: 'maps_reverse_geocode',
      description: 'Convert lat/lng coordinates to a street address using Google Geocoding API.',
      parameters: {
        type: 'object',
        properties: {
          lat: { type: 'number', description: 'Latitude' },
          lng: { type: 'number', description: 'Longitude' },
        },
        required: ['lat', 'lng'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) return NOT_CONFIGURED_ERR;
        try {
          const lat = Number(args.lat);
          const lng = Number(args.lng);
          if (isNaN(lat) || isNaN(lng)) return { error: 'Invalid lat/lng values.' };

          const url = `${MAPS_BASE}/geocode/json?latlng=${lat},${lng}&key=${getApiKey()}`;
          const data = await mapsFetch<{ status: string; results: GeocodingResult[] }>(url);

          if (data.status !== 'OK' || !data.results.length) {
            return { error: `Reverse geocoding failed: ${data.status}. No results for ${lat},${lng}.` };
          }

          const result = data.results[0];
          const components = result.address_components;
          log.info('maps_reverse_geocode', { lat, lng, trace_id: traceId });
          return {
            address: result.formatted_address,
            city: extractComponent(components, 'locality') || extractComponent(components, 'administrative_area_level_2'),
            state: extractComponent(components, 'administrative_area_level_1'),
            country: extractComponent(components, 'country'),
            postalCode: extractComponent(components, 'postal_code'),
          };
        } catch (err) {
          return { error: `Reverse geocoding failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Places Search ──
    {
      name: 'maps_places_search',
      description: 'Find nearby businesses using Google Places Text Search API. Great for competitor research and local market analysis.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (e.g., "restaurants near Casco Viejo", "tiendas de ropa Panama")' },
          location: { type: 'string', description: 'Center point as "lat,lng" (e.g., "8.9824,-79.5199")' },
          radius: { type: 'number', description: 'Search radius in meters (default: 5000, max: 50000)' },
          type: { type: 'string', description: 'Place type filter (e.g., "restaurant", "store", "cafe", "gym")' },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) return NOT_CONFIGURED_ERR;
        try {
          const query = encodeURIComponent(String(args.query));
          const radius = Math.min(Number(args.radius) || 5000, 50000);
          let url = `${MAPS_BASE}/place/textsearch/json?query=${query}&radius=${radius}&key=${getApiKey()}`;

          if (args.location) url += `&location=${encodeURIComponent(String(args.location))}`;
          if (args.type) url += `&type=${encodeURIComponent(String(args.type))}`;

          const data = await mapsFetch<{ status: string; results: PlaceResult[] }>(url);

          if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            return { error: `Places search failed: ${data.status}` };
          }

          const places = (data.results || []).slice(0, 20).map(p => ({
            name: p.name,
            address: p.formatted_address,
            rating: p.rating || null,
            totalRatings: p.user_ratings_total || 0,
            placeId: p.place_id,
            types: p.types || [],
            location: p.geometry.location,
          }));

          log.info('maps_places_search', { query: args.query, count: places.length, trace_id: traceId });
          return { success: true, places, count: places.length, source: 'google_places' };
        } catch (err) {
          return { error: `Places search failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. Place Details ──
    {
      name: 'maps_place_details',
      description: 'Get detailed info about a specific business by placeId. Returns phone, website, hours, reviews, and photos.',
      parameters: {
        type: 'object',
        properties: {
          placeId: { type: 'string', description: 'Google Place ID (from maps_places_search or maps_geocode)' },
        },
        required: ['placeId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) return NOT_CONFIGURED_ERR;
        try {
          const placeId = String(args.placeId);
          const fields = [
            'name', 'formatted_address', 'formatted_phone_number', 'website',
            'rating', 'user_ratings_total', 'reviews', 'opening_hours', 'photos', 'price_level',
          ].join(',');
          const url = `${MAPS_BASE}/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${getApiKey()}`;
          const data = await mapsFetch<{ status: string; result: PlaceDetailsResult }>(url);

          if (data.status !== 'OK') {
            return { error: `Place details failed: ${data.status}` };
          }

          const p = data.result;
          const apiKey = getApiKey();

          log.info('maps_place_details', { placeId, name: p.name, trace_id: traceId });
          return {
            name: p.name,
            address: p.formatted_address,
            phone: p.formatted_phone_number || null,
            website: p.website || null,
            rating: p.rating || null,
            reviews: (p.reviews || []).slice(0, 5).map(r => ({
              author: r.author_name,
              rating: r.rating,
              text: r.text.slice(0, 300),
              time: r.relative_time_description,
            })),
            hours: p.opening_hours?.weekday_text || null,
            photos: (p.photos || []).slice(0, 3).map(ph => (
              `${MAPS_BASE}/place/photo?maxwidth=400&photo_reference=${ph.photo_reference}&key=${apiKey}`
            )),
            priceLevel: p.price_level ?? null,
            source: 'google_places',
          };
        } catch (err) {
          return { error: `Place details failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 5. Distance Matrix ──
    {
      name: 'maps_distance_matrix',
      description: 'Calculate distances and travel times between multiple origins and destinations. Useful for delivery zone planning and logistics.',
      parameters: {
        type: 'object',
        properties: {
          origins: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of origin addresses or "lat,lng" strings',
          },
          destinations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of destination addresses or "lat,lng" strings',
          },
          mode: {
            type: 'string',
            enum: ['driving', 'walking', 'bicycling', 'transit'],
            description: 'Travel mode (default: driving)',
          },
        },
        required: ['origins', 'destinations'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) return NOT_CONFIGURED_ERR;
        try {
          const origins = Array.isArray(args.origins) ? args.origins : [String(args.origins)];
          const destinations = Array.isArray(args.destinations) ? args.destinations : [String(args.destinations)];
          const mode = String(args.mode || 'driving');

          if (!origins.length || !destinations.length) {
            return { error: 'origins and destinations arrays must not be empty.' };
          }

          const originsParam = encodeURIComponent(origins.map(String).join('|'));
          const destsParam = encodeURIComponent(destinations.map(String).join('|'));
          const url = `${MAPS_BASE}/distancematrix/json?origins=${originsParam}&destinations=${destsParam}&mode=${mode}&departure_time=now&key=${getApiKey()}`;

          const data = await mapsFetch<{
            status: string;
            origin_addresses: string[];
            destination_addresses: string[];
            rows: Array<{ elements: DistanceMatrixElement[] }>;
          }>(url);

          if (data.status !== 'OK') {
            return { error: `Distance matrix failed: ${data.status}` };
          }

          const matrix = data.rows.map((row, i) => ({
            origin: data.origin_addresses[i],
            results: row.elements.map((el, j) => ({
              destination: data.destination_addresses[j],
              distance: el.distance?.text || null,
              distanceMeters: el.distance?.value || null,
              duration: el.duration?.text || null,
              durationSeconds: el.duration?.value || null,
              trafficDuration: el.duration_in_traffic?.text || null,
              trafficDurationSeconds: el.duration_in_traffic?.value || null,
              status: el.status,
            })),
          }));

          log.info('maps_distance_matrix', {
            origins: origins.length,
            destinations: destinations.length,
            mode,
            trace_id: traceId,
          });
          return { success: true, matrix, mode, source: 'google_maps' };
        } catch (err) {
          return { error: `Distance matrix failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 6. Directions ──
    {
      name: 'maps_directions',
      description: 'Get step-by-step directions between two points. Supports driving, walking, transit, and waypoints.',
      parameters: {
        type: 'object',
        properties: {
          origin: { type: 'string', description: 'Starting address or "lat,lng"' },
          destination: { type: 'string', description: 'Destination address or "lat,lng"' },
          mode: {
            type: 'string',
            enum: ['driving', 'walking', 'bicycling', 'transit'],
            description: 'Travel mode (default: driving)',
          },
          waypoints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional intermediate stops (addresses or "lat,lng")',
          },
        },
        required: ['origin', 'destination'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) return NOT_CONFIGURED_ERR;
        try {
          const origin = encodeURIComponent(String(args.origin));
          const destination = encodeURIComponent(String(args.destination));
          const mode = String(args.mode || 'driving');

          let url = `${MAPS_BASE}/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&key=${getApiKey()}`;

          if (args.waypoints && Array.isArray(args.waypoints) && args.waypoints.length > 0) {
            const waypointsParam = encodeURIComponent(
              (args.waypoints as string[]).map(String).join('|'),
            );
            url += `&waypoints=${waypointsParam}`;
          }

          const data = await mapsFetch<{ status: string; routes: DirectionsRoute[] }>(url);

          if (data.status !== 'OK' || !data.routes.length) {
            return { error: `Directions failed: ${data.status}. No route found.` };
          }

          const route = data.routes[0];
          // Aggregate totals across all legs (for multi-waypoint routes)
          let totalDistanceMeters = 0;
          let totalDurationSeconds = 0;
          const allSteps: Array<{ instruction: string; distance: string; duration: string }> = [];

          for (const leg of route.legs) {
            totalDistanceMeters += leg.distance.value;
            totalDurationSeconds += leg.duration.value;
            for (const step of leg.steps) {
              allSteps.push({
                instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                distance: step.distance.text,
                duration: step.duration.text,
              });
            }
          }

          log.info('maps_directions', {
            origin: args.origin,
            destination: args.destination,
            mode,
            steps: allSteps.length,
            trace_id: traceId,
          });

          return {
            distance: route.legs[0].distance.text,
            distanceMeters: totalDistanceMeters,
            duration: route.legs[0].duration.text,
            durationSeconds: totalDurationSeconds,
            steps: allSteps,
            polyline: route.overview_polyline.points,
            mode,
            source: 'google_maps',
          };
        } catch (err) {
          return { error: `Directions failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
