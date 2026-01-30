/**
 * Skin Extractor Module
 * Extracts player skin information from litematic files
 */

import { parseLitematic, extractSkinsFromNBT, decodeTextureValue } from './nbt-reader.js';

/**
 * Extract all skins from a litematic file ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer - The raw litematic file data
 * @returns {Promise<Array>} Array of skin objects
 */
export async function extractSkinsFromLitematic(arrayBuffer) {
  try {
    // Parse the litematic file using our custom NBT reader
    console.log('Parsing litematic file...');
    const nbtData = parseLitematic(arrayBuffer);
    
    console.log('NBT root name:', nbtData.name);
    console.log('Litematic metadata:', {
      author: nbtData.value.Metadata?.Author,
      name: nbtData.value.Metadata?.Name,
      description: nbtData.value.Metadata?.Description,
      regionCount: nbtData.value.Metadata?.RegionCount
    });
    
    // Extract skins from block entities
    const skins = extractSkinsFromNBT(nbtData);
    
    console.log(`Found ${skins.length} unique skins`);
    
    return skins;
  } catch (error) {
    console.error('Error extracting skins:', error);
    throw error;
  }
}

/**
 * Get the skin image URL for a skin
 * @param {Object} skin - Skin data object
 * @returns {string} URL to the skin image
 */
export function getSkinImageUrl(skin) {
  // If we have a texture value, decode it to get the actual URL
  if (skin.textureValue) {
    try {
      const decoded = atob(skin.textureValue);
      const textureData = JSON.parse(decoded);
      
      if (textureData.textures && textureData.textures.SKIN) {
        const skinUrl = textureData.textures.SKIN.url;
        // Extract texture ID from the URL and use a 3D head render
        const textureId = skinUrl.split('/').pop();
        return `https://mc-heads.net/head/${textureId}/64`;
      }
    } catch (e) {
      console.warn('Failed to decode texture:', e);
    }
  }

  // Fallback placeholder
  return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%231a1a2e" width="64" height="64"/><text x="32" y="36" text-anchor="middle" fill="%2394a3b8" font-size="16">?</text></svg>';
}

/**
 * Get the download URL for a full skin
 * @param {Object} skin - Skin data object
 * @returns {string} URL to download the full skin
 */
export function getSkinDownloadUrl(skin) {
  // If we have a texture value, decode it to get the actual skin URL
  if (skin.textureValue) {
    try {
      const decoded = atob(skin.textureValue);
      const textureData = JSON.parse(decoded);
      
      if (textureData.textures && textureData.textures.SKIN) {
        const skinUrl = textureData.textures.SKIN.url.replace(/^http:\/\//, 'https://');
        return skinUrl;
      }
    } catch (e) {
      console.warn('Failed to decode texture for download:', e);
    }
  }

  return '#';
}
