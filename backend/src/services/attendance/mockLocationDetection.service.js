const logger = require('../../config/logger');

/**
 * Mock Location Detection Service
 * 
 * Detects fake GPS coordinates on mobile devices:
 * - Android: Checks isFromMockProvider flag
 * - iOS: Validates location accuracy and consistency
 * - Web: Basic sanity checks on coordinates
 */
class MockLocationDetectionService {
  constructor() {
    this.maxAccuracyMeters = 30; // Reject if accuracy > 30 meters
    this.maxSpeedKmh = 150; // Reject if speed > 150 km/h (impossible for walking)
    this.minSatellites = 4; // Minimum satellites for reliable GPS
  }

  /**
   * Detect if location is from mock provider
   */
  async detectMockLocation(locationData, platform) {
    try {
      switch (platform) {
        case 'android':
          return this.detectAndroidMockLocation(locationData);
        case 'ios':
          return this.detectIOSMockLocation(locationData);
        case 'web':
          return this.detectWebMockLocation(locationData);
        default:
          return {
            isMock: false,
            confidence: 0,
            method: 'PLATFORM_NOT_SUPPORTED',
          };
      }
    } catch (err) {
      logger.error('[MOCK LOCATION] Detection failed:', err.message);
      return {
        isMock: false,
        confidence: 0,
        reason: 'DETECTION_ERROR',
      };
    }
  }

  /**
   * Detect Android mock location
   */
  detectAndroidMockLocation(locationData) {
    const indicators = {
      isFromMockProvider: locationData.isFromMockProvider === true,
      hasMockApps: this.checkForMockApps(locationData.installedApps),
      inconsistentAccuracy: this.checkAccuracyInconsistency(locationData),
      impossibleSpeed: this.checkImpossibleSpeed(locationData),
      noSatellites: locationData.satelliteCount < this.minSatellites,
    };

    // Android-specific checks
    const androidIndicators = {
      hasTestProviders: locationData.hasTestProviders === true,
      developerModeEnabled: locationData.isDeveloperModeEnabled === true,
      adbEnabled: locationData.isAdbEnabled === true,
    };

    const allIndicators = { ...indicators, ...androidIndicators };
    const positiveIndicators = Object.values(allIndicators).filter(Boolean).length;
    const totalIndicators = Object.keys(allIndicators).length;

    const confidence = (positiveIndicators / totalIndicators) * 100;
    const isMock = confidence > 50 || allIndicators.isFromMockProvider;

    return {
      isMock,
      confidence,
      method: 'ANDROID_LOCATION_PROVIDER',
      indicators: allIndicators,
      details: {
        isFromMockProvider: allIndicators.isFromMockProvider,
        hasMockApps: allIndicators.hasMockApps,
        developerModeEnabled: allIndicators.developerModeEnabled,
      },
    };
  }

  /**
   * Detect iOS mock location
   */
  detectIOSMockLocation(locationData) {
    const indicators = {
      inconsistentAccuracy: this.checkAccuracyInconsistency(locationData),
      impossibleSpeed: this.checkImpossibleSpeed(locationData),
      lowAccuracy: locationData.accuracy > this.maxAccuracyMeters,
      noTimestamp: !locationData.timestamp,
      staleLocation: this.checkStaleLocation(locationData),
    };

    // iOS-specific checks
    const iosIndicators = {
      isJailbroken: locationData.isJailbroken === true,
      hasLocationSpoofingApps: this.checkForSpoofingApps(locationData.installedApps),
      inconsistentAltitude: this.checkAltitudeInconsistency(locationData),
    };

    const allIndicators = { ...indicators, ...iosIndicators };
    const positiveIndicators = Object.values(allIndicators).filter(Boolean).length;
    const totalIndicators = Object.keys(allIndicators).length;

    const confidence = (positiveIndicators / totalIndicators) * 100;
    const isMock = confidence > 60; // Higher threshold for iOS

    return {
      isMock,
      confidence,
      method: 'IOS_CORE_LOCATION',
      indicators: allIndicators,
      details: {
        isJailbroken: allIndicators.isJailbroken,
        hasLocationSpoofingApps: allIndicators.hasLocationSpoofingApps,
      },
    };
  }

  /**
   * Detect web mock location
   */
  detectWebMockLocation(locationData) {
    const indicators = {
      inconsistentAccuracy: this.checkAccuracyInconsistency(locationData),
      impossibleSpeed: this.checkImpossibleSpeed(locationData),
      lowAccuracy: locationData.accuracy > this.maxAccuracyMeters,
      noTimestamp: !locationData.timestamp,
      staleLocation: this.checkStaleLocation(locationData),
      suspiciousUserAgent: this.checkSuspiciousUserAgent(locationData.userAgent),
    };

    const positiveIndicators = Object.values(indicators).filter(Boolean).length;
    const totalIndicators = Object.keys(indicators).length;

    const confidence = (positiveIndicators / totalIndicators) * 100;
    const isMock = confidence > 70; // Higher threshold for web

    return {
      isMock,
      confidence,
      method: 'WEB_GEOLOCATION_API',
      indicators,
      securityLevel: 'LOW', // Web location is inherently less secure
    };
  }

  /**
   * Check for known mock location apps (Android)
   */
  checkForMockApps(installedApps = []) {
    const knownMockApps = [
      'com.lexa.fakegps',
      'com.topjohnwu.magisk', // Magisk (can be used for location spoofing)
      'com.adrianopas.chef.mockgps', // Chef: Mock GPS
      'com.func.mockgps', // Fake GPS
      'com.incorporateapps.fakegps', // Fake GPS Location
      'com.schillinglocationwatcher', // Location Watcher
      'com.marzhin.capterm', // Capture Mock
    ];

    return installedApps.some(app => knownMockApps.includes(app));
  }

  /**
   * Check for location spoofing apps (iOS)
   */
  checkForSpoofingApps(installedApps = []) {
    const knownSpoofingApps = [
      'com.spoofer.location',
      'com.fakegps.app',
      'com.location.changer',
      'itimor.locat',
      'me.foxfake',
    ];

    return installedApps.some(app => knownSpoofingApps.includes(app));
  }

  /**
   * Check accuracy inconsistency
   */
  checkAccuracyInconsistency(locationData) {
    if (!locationData.accuracy) return false;
    
    // Accuracy too high (low precision)
    if (locationData.accuracy > 100) return true;
    
    // Accuracy jumping (compare with previous location if available)
    if (locationData.previousAccuracy) {
      const accuracyJump = Math.abs(locationData.accuracy - locationData.previousAccuracy);
      if (accuracyJump > 50) return true; // 50m jump in accuracy
    }

    return false;
  }

  /**
   * Check for impossible speed
   */
  checkImpossibleSpeed(locationData) {
    if (!locationData.speed) return false;
    
    // Speed in km/h
    const speedKmh = locationData.speed * 3.6; // Convert m/s to km/h
    
    return speedKmh > this.maxSpeedKmh;
  }

  /**
   * Check for stale location
   */
  checkStaleLocation(locationData) {
    if (!locationData.timestamp) return true;
    
    const age = Date.now() - locationData.timestamp;
    const maxAge = 60000; // 1 minute
    
    return age > maxAge;
  }

  /**
   * Check altitude inconsistency (iOS)
   */
  checkAltitudeInconsistency(locationData) {
    if (!locationData.altitude) return false;
    
    // Altitude jumping
    if (locationData.previousAltitude) {
      const altitudeJump = Math.abs(locationData.altitude - locationData.previousAltitude);
      if (altitudeJump > 100) return true; // 100m jump in altitude
    }

    // Impossible altitude
    if (locationData.altitude < -500 || locationData.altitude > 9000) {
      return true;
    }

    return false;
  }

  /**
   * Check for suspicious user agent (web)
   */
  checkSuspiciousUserAgent(userAgent) {
    if (!userAgent) return false;

    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /headless/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Validate location accuracy for geo-fencing
   */
  validateLocationAccuracy(locationData) {
    if (!locationData.accuracy) {
      return {
        valid: false,
        reason: 'NO_ACCuracy',
        userFeedback: 'Location accuracy not available',
      };
    }

    if (locationData.accuracy > this.maxAccuracyMeters) {
      return {
        valid: false,
        reason: 'LOW_ACCURACY',
        userFeedback: `Location accuracy too low (${locationData.accuracy}m). Please ensure GPS signal is strong`,
      };
    }

    return {
      valid: true,
      accuracy: locationData.accuracy,
    };
  }

  /**
   * Get location metadata for logging
   */
  getLocationMetadata(locationData) {
    return {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
      timestamp: locationData.timestamp,
      speed: locationData.speed,
      altitude: locationData.altitude,
      satelliteCount: locationData.satelliteCount,
      provider: locationData.provider,
    };
  }
}

module.exports = new MockLocationDetectionService();
