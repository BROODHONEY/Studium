const supabase = require('../config/db');

const BUCKET = 'studium-files';
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

/**
 * Uploads a buffer to Supabase Storage and returns a signed URL.
 * @param {string} storagePath - Path within the bucket
 * @param {Buffer} buffer
 * @param {string} contentType
 * @returns {Promise<string>} signedUrl
 */
async function uploadAndSign(storagePath, buffer, contentType) {
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (signError) throw signError;

  return signed.signedUrl;
}

/**
 * Removes a file from Supabase Storage.
 * @param {string} storagePath
 */
async function removeFile(storagePath) {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

/**
 * Builds a safe storage path from a prefix and original filename.
 * @param {string} prefix - e.g. groupId or 'submissions/assignmentId/userId'
 * @param {string} originalname
 * @returns {string}
 */
function buildStoragePath(prefix, originalname) {
  const safeName = originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return `${prefix}/${Date.now()}-${safeName}`;
}

module.exports = { uploadAndSign, removeFile, buildStoragePath };
