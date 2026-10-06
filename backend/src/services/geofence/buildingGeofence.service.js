const { query } = require('../../config/database');
const logger = require('../../config/logger');

// Default Seed Buildings: Both Pune Main Office and Branch Office (4-Corner GPS Boundaries)
const DEFAULT_BUILDINGS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Main Office Building (Pune)',
    code: 'MAIN_OFFICE_HQ',
    address: 'Primary Office Building Premises',
    polygon_coordinates: [
      [18.619587, 73.874548],
      [18.619565, 73.874942],
      [18.619353, 73.874927],
      [18.619375, 73.874534]
    ],
    tolerance_meters: 150,
    is_active: true
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Branch Office Building (Office 2)',
    code: 'BRANCH_OFFICE_02',
    address: 'Secondary Office Building Premises',
    polygon_coordinates: [
      [19.381461, 75.467570],
      [19.381449, 75.467657],
      [19.381363, 75.467646],
      [19.381373, 75.467558]
    ],
    tolerance_meters: 150,
    is_active: true
  }
];

let tableVerified = false;

/**
 * Ensure office_building_geofences table exists idempotently
 */
async function ensureGeofenceTableExists() {
  if (tableVerified) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS office_building_geofences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        address TEXT,
        polygon_coordinates JSONB NOT NULL,
        tolerance_meters INTEGER NOT NULL DEFAULT 100,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_office_buildings_code ON office_building_geofences(code);
      CREATE INDEX IF NOT EXISTS idx_office_buildings_active ON office_building_geofences(is_active);
    `);

    // Ensure default buildings exist in DB and update polygon_coordinates if already present
    for (const def of DEFAULT_BUILDINGS) {
      await query(
        `INSERT INTO office_building_geofences (id, name, code, address, polygon_coordinates, tolerance_meters, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         ON CONFLICT (code) DO UPDATE SET 
           polygon_coordinates = EXCLUDED.polygon_coordinates,
           tolerance_meters = EXCLUDED.tolerance_meters,
           updated_at = NOW()`,
        [
          def.id,
          def.name,
          def.code,
          def.address,
          JSON.stringify(def.polygon_coordinates),
          def.tolerance_meters
        ]
      );
    }

    // Ensure all existing DB buildings have at least 150m tolerance to handle indoor GPS drift
    await query(`UPDATE office_building_geofences SET tolerance_meters = 150 WHERE tolerance_meters < 150`);

    tableVerified = true;
  } catch (err) {
    logger.warn('[BUILDING GEOFENCE] Table auto-creation notice:', err.message);
  }
}

/**
 * Ray-Casting Algorithm for Point-in-Polygon
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {Array<[number, number]>} polygon Array of [latitude, longitude] pairs
 * @returns {boolean} true if point is strictly inside polygon
 */
function isPointInPolygon(latitude, longitude, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;

  let inside = false;
  const x = Number(longitude);
  const y = Number(latitude);

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i][1]);
    const yi = Number(polygon[i][0]);
    const xj = Number(polygon[j][1]);
    const yj = Number(polygon[j][0]);

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Haversine formula to calculate distance between two GPS coordinates in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Minimum distance from a point to a line segment in meters
 */
function distanceToSegment(pLat, pLng, lat1, lng1, lat2, lng2) {
  const l2 = Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2);
  if (l2 === 0) return calculateHaversineDistance(pLat, pLng, lat1, lng1);

  let t = ((pLat - lat1) * (lat2 - lat1) + (pLng - lng1) * (lng2 - lng1)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projLat = lat1 + t * (lat2 - lat1);
  const projLng = lng1 + t * (lng2 - lng1);

  return calculateHaversineDistance(pLat, pLng, projLat, projLng);
}

/**
 * Calculate minimum distance from point to polygon perimeter in meters
 */
function distanceToPolygonPerimeter(latitude, longitude, polygon) {
  if (!Array.isArray(polygon) || polygon.length === 0) return Infinity;

  let minDistance = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const dist = distanceToSegment(
      latitude, longitude,
      polygon[i][0], polygon[i][1],
      polygon[j][0], polygon[j][1]
    );
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return minDistance;
}

/**
 * Fetch all active buildings from database with fallback to default buildings
 */
async function getActiveBuildings() {
  await ensureGeofenceTableExists();
  try {
    const { rows } = await query(
      `SELECT id, name, code, address, polygon_coordinates, tolerance_meters, is_active 
       FROM office_building_geofences 
       WHERE is_active = TRUE 
       ORDER BY created_at ASC`
    );

    if (rows && rows.length > 0) {
      return rows.map(r => ({
        ...r,
        polygon_coordinates: typeof r.polygon_coordinates === 'string'
          ? JSON.parse(r.polygon_coordinates)
          : r.polygon_coordinates
      }));
    }
  } catch (err) {
    logger.warn('[BUILDING GEOFENCE] Could not fetch buildings from DB, using fallback defaults:', err.message);
  }

  return DEFAULT_BUILDINGS;
}

/**
 * Verify if employee's GPS location is inside any registered active office building
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} accuracy GPS accuracy in meters reported by device
 * @returns {Promise<{
 *   matched: boolean,
 *   building: Object|null,
 *   isStrictInside: boolean,
 *   distanceMeters: number,
 *   status: 'LOCATION_VERIFIED'|'LOCATION_MISMATCH'|'INVALID_COORDINATES'
 * }>}
 */
async function verifyLocationInBuilding(latitude, longitude, accuracy = 0) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.warn(`[BUILDING GEOFENCE] Invalid GPS coordinates provided: Latitude=${latitude}, Longitude=${longitude}`);
    return {
      matched: false,
      building: null,
      isStrictInside: false,
      distanceMeters: null,
      status: 'INVALID_COORDINATES',
      message: 'Invalid GPS latitude/longitude coordinates provided.'
    };
  }

  console.log(`[BUILDING GEOFENCE] ================= GEOFENCE CHECK =================`);
  console.log(`[BUILDING GEOFENCE] Device GPS Coordinates: Latitude = ${lat}, Longitude = ${lng}, Accuracy = ${accuracy}m`);

  // Check Environment Bypass override
  if (process.env.ATTENDANCE_GEOFENCE_BYPASS === 'true' || process.env.DISABLE_GEOFENCE === 'true') {
    console.log(`[BUILDING GEOFENCE] ENVIRONMENT BYPASS ACTIVE: Skipping strict location check.`);
    logger.info(`[BUILDING GEOFENCE] Geofence bypass enabled via environment variable.`);
    return {
      matched: true,
      building: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Main Office Building (Pune - Bypass Mode)',
        code: 'MAIN_OFFICE_HQ',
        address: 'Bypass Verified Premises'
      },
      isStrictInside: true,
      distanceMeters: 0,
      status: 'LOCATION_VERIFIED',
      message: 'Verified via Environment Geofence Bypass'
    };
  }

  const activeBuildings = await getActiveBuildings();
  logger.info(`[BUILDING GEOFENCE] Verifying coordinates (${lat}, ${lng}, accuracy: ${accuracy}m) against ${activeBuildings.length} active buildings.`);

  let closestBuilding = null;
  let minPerimeterDistance = Infinity;

  for (const building of activeBuildings) {
    const polygon = building.polygon_coordinates;
    console.log(`[BUILDING GEOFENCE] Building: "${building.name}" (${building.code}) | 4 Corner Points:`, JSON.stringify(polygon));
    if (!polygon || polygon.length < 3) continue;

    // 1. Strict Polygon Test (Point-in-Polygon)
    const inside = isPointInPolygon(lat, lng, polygon);
    if (inside) {
      console.log(`[BUILDING GEOFENCE] ✅ MATCH SUCCESS! Device coordinates (${lat}, ${lng}) fall INSIDE the 4 points of building: "${building.name}"`);
      logger.info(`[BUILDING GEOFENCE] Point is strictly inside building: "${building.name}" (${building.code})`);
      return {
        matched: true,
        building: {
          id: building.id,
          name: building.name,
          code: building.code,
          address: building.address
        },
        isStrictInside: true,
        distanceMeters: 0,
        status: 'LOCATION_VERIFIED',
        message: `Verified inside ${building.name}`
      };
    }

    // 2. Tolerance Buffer Test (Distance to building perimeter or centroid)
    const distToPerimeter = distanceToPolygonPerimeter(lat, lng, polygon);

    let centroidLat = 0, centroidLng = 0;
    for (const pt of polygon) {
      centroidLat += Number(pt[0]);
      centroidLng += Number(pt[1]);
    }
    centroidLat /= polygon.length;
    centroidLng /= polygon.length;
    const distToCentroid = calculateHaversineDistance(lat, lng, centroidLat, centroidLng);

    const minDist = Math.min(distToPerimeter, distToCentroid);
    const buildingTolerance = Math.max(Number(building.tolerance_meters) || 150, 150);

    // Effective tolerance accounts for indoor GPS drift, hardware inaccuracy, and desktop browser IP geolocation (e.g. 50,000m)
    const defaultMaxBuffer = (accuracy && accuracy >= 1000) ? Math.min(accuracy + 1000, 100000) : 1000;
    const maxBuffer = parseInt(process.env.ATTENDANCE_LOCATION_TOLERANCE_METERS) || defaultMaxBuffer;
    const effectiveTolerance = Math.max(buildingTolerance, Math.min(buildingTolerance + (accuracy || 0), maxBuffer));

    console.log(`[BUILDING GEOFENCE] Building "${building.name}": Distance to perimeter/centroid = ${minDist.toFixed(1)}m (Effective Tolerance = ${effectiveTolerance}m)`);

    if (minDist <= effectiveTolerance) {
      console.log(`[BUILDING GEOFENCE] ✅ MATCH SUCCESS! Device within tolerance buffer (${minDist.toFixed(1)}m <= ${effectiveTolerance}m) for building: "${building.name}"`);
      logger.info(`[BUILDING GEOFENCE] Point within tolerance buffer (${minDist.toFixed(1)}m <= ${effectiveTolerance}m) for "${building.name}"`);
      return {
        matched: true,
        building: {
          id: building.id,
          name: building.name,
          code: building.code,
          address: building.address
        },
        isStrictInside: false,
        distanceMeters: Math.round(minDist),
        status: 'LOCATION_VERIFIED',
        message: `Verified within perimeter of ${building.name} (${Math.round(minDist)}m)`
      };
    }

    if (minDist < minPerimeterDistance) {
      minPerimeterDistance = minDist;
      closestBuilding = building;
    }
  }

  console.warn(`[BUILDING GEOFENCE] ❌ LOCATION MISMATCH: Device (${lat}, ${lng}) is outside all buildings. Closest: "${closestBuilding?.name || 'N/A'}" (${Math.round(minPerimeterDistance)}m away).`);
  logger.warn(`[BUILDING GEOFENCE] Location outside all buildings. Closest: "${closestBuilding?.name || 'N/A'}" (${Math.round(minPerimeterDistance)}m away).`);

  return {
    matched: false,
    building: null,
    isStrictInside: false,
    distanceMeters: Math.round(minPerimeterDistance),
    status: 'LOCATION_MISMATCH',
    message: `Location does not match: You are ${Math.round(minPerimeterDistance)} meters away from the nearest designated office building.`
  };
}

/**
 * Super Admin: Get all buildings (active and inactive)
 */
async function getAllBuildings() {
  await ensureGeofenceTableExists();
  try {
    const { rows } = await query(
      `SELECT id, name, code, address, polygon_coordinates, tolerance_meters, is_active, created_at, updated_at
       FROM office_building_geofences 
       ORDER BY created_at ASC`
    );
    if (rows && rows.length > 0) {
      return rows.map(r => ({
        ...r,
        polygon_coordinates: typeof r.polygon_coordinates === 'string'
          ? JSON.parse(r.polygon_coordinates)
          : r.polygon_coordinates
      }));
    }
  } catch (err) {
    logger.warn('Error fetching all buildings:', err.message);
  }
  return DEFAULT_BUILDINGS;
}

/**
 * Super Admin: Create new building geofence
 */
async function createBuilding({ name, code, address, polygon_coordinates, tolerance_meters = 35, is_active = true }) {
  await ensureGeofenceTableExists();
  if (!name || !polygon_coordinates || !Array.isArray(polygon_coordinates) || polygon_coordinates.length < 3) {
    const error = new Error('Building name and at least 3 corner [lat, lng] coordinates are required.');
    error.statusCode = 400;
    throw error;
  }

  let finalCode = (code || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (!finalCode) {
    finalCode = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_' + Math.floor(100 + Math.random() * 900);
  }

  // Check code conflict
  const { rows: existingCode } = await query(
    `SELECT id FROM office_building_geofences WHERE code = $1 LIMIT 1`,
    [finalCode]
  );
  if (existingCode.length > 0) {
    finalCode = `${finalCode}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const { rows: [created] } = await query(
    `INSERT INTO office_building_geofences (name, code, address, polygon_coordinates, tolerance_meters, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, code, address, polygon_coordinates, tolerance_meters, is_active, created_at, updated_at`,
    [
      name.trim(),
      finalCode,
      address ? address.trim() : null,
      JSON.stringify(polygon_coordinates),
      parseInt(tolerance_meters) || 35,
      Boolean(is_active)
    ]
  );

  return created;
}

/**
 * Super Admin: Update existing building geofence
 */
async function updateBuilding(id, { name, code, address, polygon_coordinates, tolerance_meters, is_active }) {
  await ensureGeofenceTableExists();
  const { rows: [existing] } = await query(
    `SELECT id FROM office_building_geofences WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (!existing) {
    // If not existing in DB, create new building
    return createBuilding({ name, code, address, polygon_coordinates, tolerance_meters, is_active });
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    updates.push(`name = $${idx++}`);
    values.push(name.trim());
  }
  if (code !== undefined && code.trim()) {
    updates.push(`code = $${idx++}`);
    values.push(code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
  }
  if (address !== undefined) {
    updates.push(`address = $${idx++}`);
    values.push(address.trim());
  }
  if (polygon_coordinates !== undefined) {
    if (!Array.isArray(polygon_coordinates) || polygon_coordinates.length < 3) {
      const error = new Error('Polygon must contain at least 3 coordinate pairs.');
      error.statusCode = 400;
      throw error;
    }
    updates.push(`polygon_coordinates = $${idx++}`);
    values.push(JSON.stringify(polygon_coordinates));
  }
  if (tolerance_meters !== undefined) {
    updates.push(`tolerance_meters = $${idx++}`);
    values.push(parseInt(tolerance_meters) || 35);
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${idx++}`);
    values.push(Boolean(is_active));
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const { rows: [updated] } = await query(
    `UPDATE office_building_geofences 
     SET ${updates.join(', ')} 
     WHERE id = $${idx}
     RETURNING id, name, code, address, polygon_coordinates, tolerance_meters, is_active, created_at, updated_at`,
    values
  );

  return updated;
}

/**
 * Super Admin: Delete building geofence
 */
async function deleteBuilding(id) {
  const { rows: [deleted] } = await query(
    `DELETE FROM office_building_geofences WHERE id = $1 RETURNING id, name, code`,
    [id]
  );
  if (!deleted) {
    const error = new Error('Building not found');
    error.statusCode = 404;
    throw error;
  }
  return deleted;
}

module.exports = {
  isPointInPolygon,
  calculateHaversineDistance,
  distanceToPolygonPerimeter,
  getActiveBuildings,
  verifyLocationInBuilding,
  getAllBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  DEFAULT_BUILDINGS
};
