import crypto from 'crypto';

/**
 * Signe des paramètres d'upload Cloudinary (preset "Signed").
 * Cloudinary exige que tous les paramètres envoyés à l'API (hors file,
 * cloud_name, resource_type, api_key, signature) soient inclus, triés
 * alphabétiquement, dans la chaîne signée avec CLOUDINARY_API_SECRET.
 */
export function signCloudinaryParams(params: Record<string, string>): { signature: string; timestamp: number } {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error('CLOUDINARY_API_SECRET manquant');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const toSign: Record<string, string> = { ...params, timestamp: String(timestamp) };
  const paramString = Object.keys(toSign)
    .sort()
    .map((key) => `${key}=${toSign[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(paramString + apiSecret)
    .digest('hex');

  return { signature, timestamp };
}
