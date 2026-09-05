/**
 * Utility to sanitize CloudFront asset URLs and remove erroneous '/public/' paths,
 * as well as map direct S3 bucket URLs to CloudFront CDN domain.
 */
export const getCleanImageUrl = (url) => {
  if (!url) return url;
  let clean = String(url).trim();
  clean = clean.replace(/cloudfront\.net\/public\//gi, 'cloudfront.net/');
  clean = clean.replace(/https?:\/\/[^\/]*s3[^\/]*\.amazonaws\.com\//gi, 'https://d18qh1l6j6vziz.cloudfront.net/');
  return clean;
};

