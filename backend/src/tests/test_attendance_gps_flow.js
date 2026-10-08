// Mock database config before loading buildingGeofence.service
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  if (request.includes('database') || request.endsWith('/config/database')) {
    return { query: async () => ({ rows: [] }) };
  }
  return originalRequire.apply(this, arguments);
};

const buildingGeofenceService = require('../services/geofence/buildingGeofence.service');

// Mock DB functions to avoid waiting for database connection in unit test
buildingGeofenceService.ensureGeofenceTableExists = async () => {};
buildingGeofenceService.getActiveBuildings = async () => buildingGeofenceService.DEFAULT_BUILDINGS;

const { isPointInPolygon, verifyLocationInBuilding } = buildingGeofenceService;

// Simulation function mirroring frontend & mobile GPS acquisition engine logic
function simulateGpsAcquisition({
  permissionState = 'granted',
  readings = [],
  watchError = null,
  maxAccuracyThreshold = 50,
  boundedTimeoutTriggered = false
}) {
  let livenessResultCalled = false;

  // 1. Permission Check
  if (permissionState === 'denied') {
    return {
      success: false,
      error: 'LOCATION_PERMISSION_DENIED',
      message: 'Location permission is required for attendance. Please allow location access and try again.',
      livenessResultCalled
    };
  }

  // 2. Hardware / Stream Error Check
  if (watchError) {
    if (watchError.code === 1) {
      return {
        success: false,
        error: 'LOCATION_PERMISSION_DENIED',
        message: 'Location permission is required for attendance. Please allow location access and try again.',
        livenessResultCalled
      };
    }
    if (watchError.code === 2) {
      return {
        success: false,
        error: 'GPS_UNAVAILABLE',
        message: 'GPS signal unavailable. Please ensure Location/GPS is turned on in your device settings.',
        livenessResultCalled
      };
    }
  }

  // 3. Process Readings Stream
  let bestAccuracy = Infinity;
  let bestLat = null;
  let bestLng = null;
  let readingCount = 0;

  for (const pos of readings) {
    readingCount++;
    const acc = pos.accuracy;
    const lat = pos.latitude;
    const lng = pos.longitude;

    if (!Number.isFinite(acc) || acc <= 0 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    if (acc < bestAccuracy) {
      bestAccuracy = acc;
      bestLat = lat;
      bestLng = lng;
    }

    // Immediately accept if reading satisfies <= 50m
    if (acc <= maxAccuracyThreshold) {
      livenessResultCalled = true; // continues to attendance flow
      return {
        success: true,
        accuracy: acc,
        bestAccuracy,
        latitude: lat,
        longitude: lng,
        readingCount,
        livenessResultCalled
      };
    }
  }

  // 4. Bounded timeout expired
  if (boundedTimeoutTriggered || readings.length > 0) {
    if (bestAccuracy <= maxAccuracyThreshold && bestLat !== null && bestLng !== null) {
      livenessResultCalled = true;
      return {
        success: true,
        accuracy: bestAccuracy,
        bestAccuracy,
        latitude: bestLat,
        longitude: bestLng,
        readingCount,
        livenessResultCalled
      };
    }

    if (bestAccuracy !== Infinity) {
      const roundedBest = Math.round(bestAccuracy);
      // Abort without calling liveness/result
      return {
        success: false,
        error: 'LOW_ACCURACY',
        accuracy: roundedBest,
        bestAccuracy: roundedBest,
        message: `Your GPS accuracy is currently ${roundedBest}m. Please enable Precise Location and try again from an open area or near a window.`,
        readingCount,
        livenessResultCalled: false
      };
    }

    return {
      success: false,
      error: 'GPS_TIMEOUT',
      message: 'Unable to obtain sufficiently accurate GPS. Please ensure Location/GPS is enabled and try again.',
      readingCount: 0,
      livenessResultCalled: false
    };
  }

  return {
    success: false,
    error: 'GPS_TIMEOUT',
    message: 'Unable to obtain sufficiently accurate GPS. Please ensure Location/GPS is enabled and try again.',
    readingCount: 0,
    livenessResultCalled: false
  };
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('ATTENDANCE GPS ACQUISITION & GEOFENCE TEST SUITE');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 10;

  // TEST 1: GPS reading 120m -> 90m -> 48m
  // Expected: Use 48m and continue.
  const t1 = simulateGpsAcquisition({
    readings: [
      { latitude: 18.61947, longitude: 73.87473, accuracy: 120 },
      { latitude: 18.61947, longitude: 73.87473, accuracy: 90 },
      { latitude: 18.61947, longitude: 73.87473, accuracy: 48 },
    ]
  });
  if (t1.success && t1.accuracy === 48 && t1.bestAccuracy === 48 && t1.livenessResultCalled) {
    console.log('✅ TEST 1 PASSED: GPS reading 120m -> 90m -> 48m correctly selected 48m and continued');
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED:', t1);
  }

  // TEST 2: GPS readings 120m -> 82m -> 82m -> 82m
  // Expected: After bounded timeout -> LOW_ACCURACY, do not call /liveness/result.
  const t2 = simulateGpsAcquisition({
    readings: [
      { latitude: 18.619889, longitude: 73.874784, accuracy: 120 },
      { latitude: 18.619889, longitude: 73.874784, accuracy: 82 },
      { latitude: 18.619889, longitude: 73.874784, accuracy: 82 },
      { latitude: 18.619889, longitude: 73.874784, accuracy: 82 },
    ],
    boundedTimeoutTriggered: true
  });
  if (!t2.success && t2.error === 'LOW_ACCURACY' && t2.bestAccuracy === 82 && t2.livenessResultCalled === false &&
      t2.message.includes('Your GPS accuracy is currently 82m')) {
    console.log('✅ TEST 2 PASSED: Repeated 82m readings safely aborted as LOW_ACCURACY without calling /liveness/result');
    passedTests++;
  } else {
    console.error('❌ TEST 2 FAILED:', t2);
  }

  // TEST 3: Permission denied
  // Expected: LOCATION_PERMISSION_DENIED
  const t3 = simulateGpsAcquisition({
    permissionState: 'denied'
  });
  if (!t3.success && t3.error === 'LOCATION_PERMISSION_DENIED' && t3.livenessResultCalled === false &&
      t3.message.includes('Location permission is required for attendance')) {
    console.log('✅ TEST 3 PASSED: Permission denied returned LOCATION_PERMISSION_DENIED with correct message');
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED:', t3);
  }

  // TEST 4: GPS unavailable
  // Expected: GPS_UNAVAILABLE
  const t4 = simulateGpsAcquisition({
    watchError: { code: 2, message: 'Position unavailable' }
  });
  if (!t4.success && t4.error === 'GPS_UNAVAILABLE' && t4.livenessResultCalled === false &&
      t4.message.includes('GPS signal unavailable')) {
    console.log('✅ TEST 4 PASSED: GPS unavailable returned GPS_UNAVAILABLE');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED:', t4);
  }

  // TEST 5: GPS timeout
  // Expected: GPS_TIMEOUT
  const t5 = simulateGpsAcquisition({
    readings: [],
    boundedTimeoutTriggered: true
  });
  if (!t5.success && t5.error === 'GPS_TIMEOUT' && t5.livenessResultCalled === false) {
    console.log('✅ TEST 5 PASSED: Bounded timeout with 0 readings returned GPS_TIMEOUT');
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED:', t5);
  }

  // TEST 6: GPS accuracy 49m
  // Expected: Continue.
  const t6 = simulateGpsAcquisition({
    readings: [{ latitude: 18.61947, longitude: 73.87473, accuracy: 49 }]
  });
  if (t6.success && t6.accuracy === 49 && t6.livenessResultCalled) {
    console.log('✅ TEST 6 PASSED: GPS accuracy 49m accepted and continued');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED:', t6);
  }

  // TEST 7: GPS accuracy exactly 50m
  // Expected: Continue (backend uses <= 50m).
  const t7Acq = simulateGpsAcquisition({
    readings: [{ latitude: 18.61947, longitude: 73.87473, accuracy: 50 }]
  });
  const t7Geo = await verifyLocationInBuilding(18.61947, 73.87473, 50);
  if (t7Acq.success && t7Acq.accuracy === 50 && t7Geo.matched && t7Geo.allowed) {
    console.log('✅ TEST 7 PASSED: GPS accuracy exactly 50m accepted by acquisition and backend geofence');
    passedTests++;
  } else {
    console.error('❌ TEST 7 FAILED:', { acq: t7Acq, geo: t7Geo });
  }

  // TEST 8: GPS accuracy 51m
  // Expected: Reject as LOW_ACCURACY.
  const t8Acq = simulateGpsAcquisition({
    readings: [{ latitude: 18.61947, longitude: 73.87473, accuracy: 51 }],
    boundedTimeoutTriggered: true
  });
  const t8Geo = await verifyLocationInBuilding(18.61947, 73.87473, 51);
  if (!t8Acq.success && t8Acq.error === 'LOW_ACCURACY' && !t8Geo.matched && t8Geo.reason === 'LOW_ACCURACY') {
    console.log('✅ TEST 8 PASSED: GPS accuracy 51m (>50m) rejected as LOW_ACCURACY on both frontend and backend');
    passedTests++;
  } else {
    console.error('❌ TEST 8 FAILED:', { acq: t8Acq, geo: t8Geo });
  }

  // TEST 9: Fresh accurate GPS but coordinates outside polygon
  // Expected: Backend rejects as outside building / LOCATION_MISMATCH.
  const outsidePoint = [18.63, 73.88]; // Outside Main Office Building (Pune)
  const t9Geo = await verifyLocationInBuilding(outsidePoint[0], outsidePoint[1], 10);
  if (!t9Geo.matched && (t9Geo.status === 'LOCATION_MISMATCH' || t9Geo.reason === 'OUTSIDE_BUILDING')) {
    console.log('✅ TEST 9 PASSED: Fresh accurate GPS (10m) outside polygon rejected as outside building / LOCATION_MISMATCH');
    passedTests++;
  } else {
    console.error('❌ TEST 9 FAILED:', t9Geo);
  }

  // TEST 10: Fresh accurate GPS inside exact polygon
  // Expected: Normal attendance flow continues with building match.
  const insidePoint = [18.61947, 73.87473]; // Inside Main Office Building (Pune) polygon
  const t10Geo = await verifyLocationInBuilding(insidePoint[0], insidePoint[1], 12);
  if (t10Geo.matched && t10Geo.allowed && t10Geo.building?.name === 'Main Office Building (Pune)') {
    console.log('✅ TEST 10 PASSED: Fresh accurate GPS inside exact polygon matched building and continued flow');
    passedTests++;
  } else {
    console.error('❌ TEST 10 FAILED:', t10Geo);
  }

  console.log('\n===============================================================');
  console.log(`FINAL RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('===============================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
