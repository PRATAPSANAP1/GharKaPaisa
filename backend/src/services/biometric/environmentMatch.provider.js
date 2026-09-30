const logger = require('../../config/logger');

/**
 * EnvironmentMatchProvider
 * Handles office environment reference matching (BKG1-BKG4).
 *
 * NOTE: AWS Rekognition CompareFaces is strictly designed for facial comparison and must NOT
 * be used for generic office scene/background matching. Until a genuine scene/environment
 * segmentation provider is configured, environment verification is marked as PROVIDER_PENDING.
 * The four approved office images (BKG1, BKG2, BKG3, BKG4) remain secure reference anchors.
 */
class EnvironmentMatchProvider {
  constructor() {
    this.providerName = 'OFFICE_ENVIRONMENT_SCENE_MATCHER';
    // Genuine scene/environment matching is not supported via CompareFaces; mark as pending.
    this.isConfigured = false;
    this.status = 'PROVIDER_PENDING';
  }

  /**
   * Evaluate live camera scene against approved office environment references (BKG1-BKG4).
   * Fails closed without fabricating scores or misusing CompareFaces.
   *
   * @param {Buffer} liveImageBuffer 
   * @param {Array} activeEnvironmentReferences 
   */
  async compareScene(liveImageBuffer, activeEnvironmentReferences = []) {
    logger.info('[ENVIRONMENT PROVIDER] Environment matching provider is pending genuine scene-matcher integration — failing closed per policy.');

    return {
      matched: false,
      matchStatus: 'ENVIRONMENT_PROVIDER_PENDING',
      matchedCode: null,
      similarity: 0,
      threshold: 80,
      providerName: this.providerName,
      message: 'Environment provider remains pending; Rekognition CompareFaces is not suitable for generic office scene matching.',
    };
  }

  getProviderInfo() {
    return {
      providerName: this.providerName,
      status: this.status,
      isConfigured: false,
      message: 'Environment provider remains pending; genuine scene/environment matching integration required.',
    };
  }
}

module.exports = new EnvironmentMatchProvider();
