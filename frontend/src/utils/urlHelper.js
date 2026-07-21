/**
 * Utility to sanitize CloudFront asset URLs and remove erroneous '/public/' paths.
 */
export const getCleanImageUrl = (url) => {
  if (!url) return url;
  return String(url).replace(/cloudfront\.net\/public\//g, 'cloudfront.net/');
};
