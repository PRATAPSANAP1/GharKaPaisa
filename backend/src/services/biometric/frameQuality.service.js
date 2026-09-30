const sharp = require('sharp');
const logger = require('../../config/logger');

/**
 * Frame Quality Check Service
 * 
 * Performs local, lightweight quality checks before calling expensive AWS Rekognition:
 * - Resolution validation
 * - Blur detection using Laplacian variance
 * - Exposure detection (underexposed/overexposed)
 * - Face presence detection
 * - Compression artifact detection
 */
class FrameQualityService {
  constructor() {
    this.minWidth = 400;
    this.minHeight = 400;
    this.maxWidth = 4096;
    this.maxHeight = 4096;
    this.minLaplacianVariance = 100; // Threshold for blur detection
    this.minBrightness = 30; // 0-255 scale
    this.maxBrightness = 230; // 0-255 scale
    this.maxFileSizeBytes = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Perform comprehensive frame quality check
   */
  async checkFrameQuality(imageBuffer, mimeType) {
    try {
      // Check file size
      const fileSize = imageBuffer.length;
      if (fileSize > this.maxFileSizeBytes) {
        return {
          passed: false,
          reason: 'FILE_TOO_LARGE',
          userFeedback: `Image size exceeds ${this.maxFileSizeBytes / 1024 / 1024}MB limit`,
          details: { fileSize, maxSize: this.maxFileSizeBytes },
        };
      }

      // Check MIME type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        return {
          passed: false,
          reason: 'INVALID_MIME_TYPE',
          userFeedback: 'Only JPEG, PNG, and WebP images are supported',
          details: { mimeType },
        };
      }

      // Use Sharp to analyze image
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Check resolution
      if (metadata.width < this.minWidth || metadata.height < this.minHeight) {
        return {
          passed: false,
          reason: 'RESOLUTION_TOO_LOW',
          userFeedback: `Image resolution too low. Minimum: ${this.minWidth}x${this.minHeight}`,
          details: {
            width: metadata.width,
            height: metadata.height,
            minWidth: this.minWidth,
            minHeight: this.minHeight,
          },
        };
      }

      if (metadata.width > this.maxWidth || metadata.height > this.maxHeight) {
        return {
          passed: false,
          reason: 'RESOLUTION_TOO_HIGH',
          userFeedback: `Image resolution too high. Maximum: ${this.maxWidth}x${this.maxHeight}`,
          details: {
            width: metadata.width,
            height: metadata.height,
            maxWidth: this.maxWidth,
            maxHeight: this.maxHeight,
          },
        };
      }

      // Check for blur using Laplacian variance
      const blurCheck = await this.checkBlur(image);
      if (!blurCheck.passed) {
        return {
          passed: false,
          reason: 'IMAGE_BLURRY',
          userFeedback: 'Image is too blurry. Please hold your device steady',
          details: blurCheck.details,
        };
      }

      // Check exposure
      const exposureCheck = await this.checkExposure(image);
      if (!exposureCheck.passed) {
        return {
          passed: false,
          reason: exposureCheck.reason,
          userFeedback: exposureCheck.userFeedback,
          details: exposureCheck.details,
        };
      }

      // Check for compression artifacts
      const artifactCheck = await this.checkCompressionArtifacts(image, metadata);
      if (!artifactCheck.passed) {
        return {
          passed: false,
          reason: 'COMPRESSION_ARTIFACTS',
          userFeedback: 'Image has compression artifacts. Please use a higher quality image',
          details: artifactCheck.details,
        };
      }

      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore({
        resolution: metadata.width * metadata.height,
        blurScore: blurCheck.variance,
        brightness: exposureCheck.brightness,
        compressionQuality: metadata.quality || 80,
      });

      logger.info(`[FRAME QUALITY] Quality check passed. Score: ${qualityScore}`);

      return {
        passed: true,
        score: qualityScore,
        details: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          blurVariance: blurCheck.variance,
          brightness: exposureCheck.brightness,
          lightingCondition: exposureCheck.condition,
        },
      };
    } catch (err) {
      logger.error('[FRAME QUALITY] Quality check failed:', err.message);
      return {
        passed: false,
        reason: 'QUALITY_CHECK_ERROR',
        userFeedback: 'Failed to analyze image quality. Please try again',
        error: err.message,
      };
    }
  }

  /**
   * Check for image blur using Laplacian variance
   * Lower variance indicates more blur
   */
  async checkBlur(image) {
    try {
      // Convert to grayscale and resize for faster processing
      const { data } = await image
        .resize(300, 300, { fit: 'cover' })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calculate Laplacian variance (simplified version)
      // In production, use OpenCV or a dedicated CV library
      const variance = this.calculateLaplacianVariance(data, 300, 300);

      const passed = variance >= this.minLaplacianVariance;

      return {
        passed,
        variance,
        threshold: this.minLaplacianVariance,
        details: { variance, threshold: this.minLaplacianVariance },
      };
    } catch (err) {
      logger.error('[FRAME QUALITY] Blur check failed:', err.message);
      return {
        passed: true, // Fail open if blur check fails
        variance: 0,
        reason: 'BLUR_CHECK_ERROR',
      };
    }
  }

  /**
   * Calculate Laplacian variance (simplified implementation)
   * In production, use OpenCV's cv2.Laplacian()
   */
  calculateLaplacianVariance(data, width, height) {
    // Simplified edge detection - calculate variance of pixel differences
    let sum = 0;
    let sumSquares = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const center = data[idx];
        
        // Calculate horizontal and vertical gradients
        const gradientX = 
          Math.abs(data[idx - 1] - data[idx + 1]) +
          Math.abs(data[idx - width] - data[idx + width]);
        
        const gradientY = 
          Math.abs(data[idx - width - 1] - data[idx + width + 1]) +
          Math.abs(data[idx - width + 1] - data[idx + width - 1]);
        
        const gradient = (gradientX + gradientY) / 2;
        
        sum += gradient;
        sumSquares += gradient * gradient;
        count++;
      }
    }

    const mean = sum / count;
    const variance = (sumSquares / count) - (mean * mean);
    
    return Math.abs(variance);
  }

  /**
   * Check image exposure (brightness)
   */
  async checkExposure(image) {
    try {
      // Get image statistics
      const { data } = await image
        .resize(100, 100, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calculate average brightness
      let totalBrightness = 0;
      let pixelCount = 0;

      for (let i = 0; i < data.length; i += 3) {
        // Convert RGB to grayscale using luminosity formula
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        totalBrightness += brightness;
        pixelCount++;
      }

      const averageBrightness = totalBrightness / pixelCount;

      // Determine lighting condition
      let condition = 'GOOD';
      let passed = true;
      let userFeedback = null;

      if (averageBrightness < this.minBrightness) {
        condition = 'LOW_LIGHT';
        passed = false;
        userFeedback = 'Image is too dark. Please move to a well-lit area';
      } else if (averageBrightness > this.maxBrightness) {
        condition = 'BRIGHT';
        passed = false;
        userFeedback = 'Image is too bright. Please reduce lighting or adjust camera';
      } else if (averageBrightness < 60) {
        condition = 'DIM';
        userFeedback = 'Lighting is somewhat dim. Better lighting recommended';
      } else if (averageBrightness > 200) {
        condition = 'BACKLIT';
        userFeedback = 'Possible backlighting. Face may be in shadow';
      }

      return {
        passed,
        reason: passed ? null : condition === 'LOW_LIGHT' ? 'UNDEREXPOSED' : 'OVEREXPOSED',
        userFeedback,
        brightness: averageBrightness,
        condition,
        details: {
          brightness: averageBrightness,
          min: this.minBrightness,
          max: this.maxBrightness,
        },
      };
    } catch (err) {
      logger.error('[FRAME QUALITY] Exposure check failed:', err.message);
      return {
        passed: true, // Fail open if exposure check fails
        brightness: 128,
        condition: 'UNKNOWN',
        reason: 'EXPOSURE_CHECK_ERROR',
      };
    }
  }

  /**
   * Check for compression artifacts
   */
  async checkCompressionArtifacts(image, metadata) {
    try {
      // Check JPEG quality if available
      if (metadata.format === 'jpeg' && metadata.quality) {
        if (metadata.quality < 60) {
          return {
            passed: false,
            details: {
              quality: metadata.quality,
              threshold: 60,
            },
          };
        }
      }

      // Check for blocking artifacts (simplified)
      // In production, use more sophisticated artifact detection
      const { data } = await image
        .resize(200, 200, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Check for high-frequency noise (indicates compression)
      let highFrequencyCount = 0;
      const threshold = 30;

      for (let i = 0; i < data.length - 3; i += 3) {
        const diff = Math.abs(data[i] - data[i + 3]);
        if (diff > threshold) {
          highFrequencyCount++;
        }
      }

      const artifactRatio = highFrequencyCount / (data.length / 3);
      
      // If too many high-frequency differences, likely compression artifacts
      if (artifactRatio > 0.3) {
        return {
          passed: false,
          details: {
            artifactRatio,
            threshold: 0.3,
          },
        };
      }

      return {
        passed: true,
        details: {
          artifactRatio,
          threshold: 0.3,
        },
      };
    } catch (err) {
      logger.error('[FRAME QUALITY] Artifact check failed:', err.message);
      return {
        passed: true, // Fail open if artifact check fails
        reason: 'ARTIFACT_CHECK_ERROR',
      };
    }
  }

  /**
   * Calculate overall quality score (0-100)
   */
  calculateQualityScore(metrics) {
    let score = 0;

    // Resolution score (0-30)
    const resolutionScore = Math.min(30, (metrics.resolution / (1920 * 1080)) * 30);
    score += resolutionScore;

    // Blur score (0-40)
    const blurScore = Math.min(40, (metrics.blurScore / 500) * 40);
    score += blurScore;

    // Brightness score (0-20)
    const brightnessScore = Math.min(20, 20 - Math.abs(metrics.brightness - 128) / 6.4);
    score += brightnessScore;

    // Compression quality score (0-10)
    const compressionScore = Math.min(10, metrics.compressionQuality / 10);
    score += compressionScore;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Detect face presence (placeholder for face detection)
   * In production, use TensorFlow.js or OpenCV
   */
  async detectFacePresence(imageBuffer) {
    // Placeholder - in production, use actual face detection
    // For now, we'll return true to fail open
    return {
      detected: true,
      confidence: 0.95,
      boundingBox: null,
    };
  }

  /**
   * Detect occlusions (glasses, masks, etc.)
   * In production, use ML-based occlusion detection
   */
  async detectOcclusions(imageBuffer) {
    // Placeholder - in production, use actual occlusion detection
    return {
      hasOcclusion: false,
      occlusionType: null,
      confidence: 0,
    };
  }
}

module.exports = new FrameQualityService();
