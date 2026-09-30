const { query } = require('../../config/database');
const logger = require('../../config/logger');
const ipaddr = require('ipaddr.js');

/**
 * @deprecated UNUSED EXPERIMENTAL ENHANCED ENVIRONMENT PROVIDER
 * Final V1 architecture uses primary environmentMatch.provider.js (BKG reference lookup).
 * This alternative weighted scoring module is not mounted in the main verification pipeline.
 */
class EnvironmentMatchEnhancedProvider {
  constructor() {
    this.providerName = 'ENHANCED_ENVIRONMENT_MATCHER';
    this.visualMatchThreshold = 75; // Lower threshold for visual match
    this.networkMatchWeight = 0.4; // 40% weight for network verification
    this.geoMatchWeight = 0.3; // 30% weight for geo verification
    this.visualMatchWeight = 0.3; // 30% weight for visual match
  }

  /**
   * Main environment verification with fallback anchors
   */
  async compareScene(liveImageBuffer, activeEnvironmentReferences = [], clientContext = {}) {
    const {
      clientIp,
      clientBssid,
      clientLatitude,
      clientLongitude,
      locationAccuracy,
      officeCode
    } = clientContext;

    logger.info('[ENHANCED ENVIRONMENT] Starting environment verification with fallback anchors');

    // Step 1: Try visual environment match first
    const visualResult = await this.performVisualMatch(liveImageBuffer, activeEnvironmentReferences);

    // Step 2: If visual match is weak, try secondary anchors
    if (visualResult.matched && visualResult.similarity >= this.visualMatchThreshold) {
      logger.info('[ENHANCED ENVIRONMENT] Visual match passed - skipping secondary anchors');
      return {
        matched: true,
        matchStatus: 'ENVIRONMENT_VISUAL_PASSED',
        matchedCode: visualResult.matchedCode,
        similarity: visualResult.similarity,
        threshold: this.visualMatchThreshold,
        providerName: this.providerName,
        method: 'VISUAL_ONLY',
        visualScore: visualResult.similarity,
        networkScore: null,
        geoScore: null,
      };
    }

    logger.info('[ENHANCED ENVIRONMENT] Visual match weak or failed - trying secondary anchors');

    // Step 3: Get office network whitelist
    const officeNetwork = await this.getOfficeNetworkWhitelist(officeCode);
    if (!officeNetwork) {
      logger.warn('[ENHANCED ENVIRONMENT] No office network whitelist found for fallback');
      return {
        matched: false,
        matchStatus: 'ENVIRONMENT_NO_FALLBACK_CONFIG',
        matchedCode: null,
        similarity: visualResult.similarity,
        threshold: this.visualMatchThreshold,
        providerName: this.providerName,
        message: 'Visual match failed and no fallback configuration available',
      };
    }

    // Step 4: Perform network verification
    const networkResult = await this.verifyNetwork(clientIp, clientBssid, officeNetwork);

    // Step 5: Perform geo verification if enabled
    let geoResult = { matched: null, score: 0 };
    if (officeNetwork.geo_fence_enabled && clientLatitude && clientLongitude) {
      geoResult = await this.verifyGeoFence(
        clientLatitude,
        clientLongitude,
        locationAccuracy,
        officeNetwork
      );
    }

    // Step 6: Calculate combined score
    const combinedScore = this.calculateCombinedScore(
      visualResult.similarity,
      networkResult.score,
      geoResult.score,
      officeNetwork
    );

    const combinedThreshold = this.calculateCombinedThreshold(officeNetwork);

    const isMatched = combinedScore >= combinedThreshold;

    logger.info(`[ENHANCED ENVIRONMENT] Combined score: ${combinedScore}%, Threshold: ${combinedThreshold}%`);

    return {
      matched: isMatched,
      matchStatus: isMatched ? 'ENVIRONMENT_HYBRID_PASSED' : 'ENVIRONMENT_HYBRID_FAILED',
      matchedCode: isMatched ? officeNetwork.office_code : null,
      similarity: combinedScore,
      threshold: combinedThreshold,
      providerName: this.providerName,
      method: 'HYBRID_FALLBACK',
      visualScore: visualResult.similarity,
      networkScore: networkResult.score,
      geoScore: geoResult.score,
      networkStatus: networkResult.status,
      geoStatus: geoResult.status,
      breakdown: {
        visual: visualResult.similarity,
        network: networkResult.score,
        geo: geoResult.score,
        weights: {
          visual: this.visualMatchWeight,
          network: this.networkMatchWeight,
          geo: this.geoMatchWeight,
        },
      },
    };
  }

  /**
   * Perform visual environment match (placeholder for future integration)
   */
  async performVisualMatch(liveImageBuffer, activeEnvironmentReferences) {
    // Currently pending genuine scene-matcher integration
    // Returns a weak match to trigger fallback anchors
    return {
      matched: false,
      matchedCode: null,
      similarity: 0,
      matchStatus: 'VISUAL_PROVIDER_PENDING',
    };
  }

  /**
   * Verify network against office whitelist
   */
  async verifyNetwork(clientIp, clientBssid, officeNetwork) {
    if (!clientIp && !clientBssid) {
      return {
        matched: null,
        score: 0,
        status: 'NETWORK_NO_CLIENT_DATA',
      };
    }

    let ipMatch = false;
    let bssidMatch = false;

    // Check IP address/range
    if (clientIp && officeNetwork.allowed_ip_addresses && officeNetwork.allowed_ip_addresses.length > 0) {
      ipMatch = officeNetwork.allowed_ip_addresses.includes(clientIp);
    }

    if (clientIp && officeNetwork.allowed_ip_ranges && officeNetwork.allowed_ip_ranges.length > 0) {
      try {
        const clientAddr = ipaddr.parse(clientIp);
        for (const range of officeNetwork.allowed_ip_ranges) {
          try {
            const rangeAddr = ipaddr.parseCIDR(range);
            if (clientAddr.match(rangeAddr)) {
              ipMatch = true;
              break;
            }
          } catch (e) {
            logger.warn(`[NETWORK VERIFY] Invalid CIDR range: ${range}`);
          }
        }
      } catch (e) {
        logger.warn(`[NETWORK VERIFY] Invalid client IP: ${clientIp}`);
      }
    }

    // Check BSSID (Wi-Fi MAC address)
    if (clientBssid && officeNetwork.allowed_bssids && officeNetwork.allowed_bssids.length > 0) {
      const normalizedBssid = clientBssid.toLowerCase().replace(/[:-]/g, '');
      bssidMatch = officeNetwork.allowed_bssids.some(
        (allowedBssid) => allowedBssid.toLowerCase().replace(/[:-]/g, '') === normalizedBssid
      );
    }

    // Calculate network score
    let score = 0;
    if (ipMatch && bssidMatch) {
      score = 100;
    } else if (ipMatch || bssidMatch) {
      score = 80;
    }

    return {
      matched: ipMatch || bssidMatch,
      score,
      status: ipMatch || bssidMatch ? 'NETWORK_PASSED' : 'NETWORK_FAILED',
      ipMatch,
      bssidMatch,
    };
  }

  /**
   * Verify geo-fence
   */
  async verifyGeoFence(clientLat, clientLon, accuracy, officeNetwork) {
    if (!officeNetwork.geo_fence_enabled) {
      return {
        matched: null,
        score: 0,
        status: 'GEO_DISABLED',
      };
    }

    if (!clientLat || !clientLon) {
      return {
        matched: null,
        score: 0,
        status: 'GEO_NO_CLIENT_DATA',
      };
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      clientLat,
      clientLon,
      officeNetwork.geo_fence_center_lat,
      officeNetwork.geo_fence_center_lon
    );

    // Add accuracy buffer
    const effectiveRadius = officeNetwork.geo_fence_radius_meters + (accuracy || 0);
    const isWithinFence = distance <= effectiveRadius;

    // Calculate score based on distance
    let score = 0;
    if (isWithinFence) {
      score = Math.max(0, 100 - (distance / effectiveRadius) * 20); // Score degrades with distance
    }

    return {
      matched: isWithinFence,
      score,
      status: isWithinFence ? 'GEO_PASSED' : 'GEO_FAILED',
      distance,
      radius: effectiveRadius,
    };
  }

  /**
   * Calculate combined score from all verification methods
   */
  calculateCombinedScore(visualScore, networkScore, geoScore, officeNetwork) {
    let totalWeight = 0;
    let weightedSum = 0;

    // Visual match weight
    if (visualScore !== null && visualScore !== undefined) {
      weightedSum += visualScore * this.visualMatchWeight;
      totalWeight += this.visualMatchWeight;
    }

    // Network match weight
    if (networkScore !== null && networkScore !== undefined) {
      weightedSum += networkScore * this.networkMatchWeight;
      totalWeight += this.networkMatchWeight;
    }

    // Geo match weight
    if (geoScore !== null && geoScore !== undefined) {
      weightedSum += geoScore * this.geoMatchWeight;
      totalWeight += this.geoMatchWeight;
    }

    // Normalize if some methods are unavailable
    if (totalWeight > 0) {
      return (weightedSum / totalWeight) * 100;
    }

    return 0;
  }

  /**
   * Calculate dynamic threshold based on available methods
   */
  calculateCombinedThreshold(officeNetwork) {
    let baseThreshold = 70; // Base threshold

    // Lower threshold if visual matching is disabled
    if (!officeNetwork.fallback_enabled) {
      baseThreshold = 80; // Stricter if only visual is available
    }

    return baseThreshold;
  }

  /**
   * Get office network whitelist
   */
  async getOfficeNetworkWhitelist(officeCode) {
    try {
      const { rows: [office] } = await query(
        `SELECT * FROM office_network_whitelist 
         WHERE office_code = $1 AND network_status = 'ACTIVE' 
         LIMIT 1`,
        [officeCode]
      );
      return office || null;
    } catch (err) {
      logger.error('[ENHANCED ENVIRONMENT] Failed to fetch office network whitelist:', err.message);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getProviderInfo() {
    return {
      providerName: this.providerName,
      status: 'ACTIVE',
      isConfigured: true,
      features: [
        'Visual environment matching (pending)',
        'Network BSSID/IP whitelist validation',
        'Geo-fencing validation',
        'Hybrid scoring with fallback anchors',
      ],
      weights: {
        visual: this.visualMatchWeight,
        network: this.networkMatchWeight,
        geo: this.geoMatchWeight,
      },
    };
  }
}

module.exports = new EnvironmentMatchEnhancedProvider();
