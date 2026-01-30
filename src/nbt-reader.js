/**
 * NBT Reader Module
 * Parses NBT (Named Binary Tag) format used by Minecraft
 * Litematic files are gzip-compressed NBT files
 */

import pako from 'pako';

// NBT Tag Types
const TAG_END = 0;
const TAG_BYTE = 1;
const TAG_SHORT = 2;
const TAG_INT = 3;
const TAG_LONG = 4;
const TAG_FLOAT = 5;
const TAG_DOUBLE = 6;
const TAG_BYTE_ARRAY = 7;
const TAG_STRING = 8;
const TAG_LIST = 9;
const TAG_COMPOUND = 10;
const TAG_INT_ARRAY = 11;
const TAG_LONG_ARRAY = 12;

/**
 * NBT Reader class for parsing NBT binary data
 */
class NBTReader {
  constructor(buffer) {
    this.buffer = new DataView(buffer);
    this.offset = 0;
  }

  readByte() {
    const value = this.buffer.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readUByte() {
    const value = this.buffer.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readShort() {
    const value = this.buffer.getInt16(this.offset, false); // Big endian
    this.offset += 2;
    return value;
  }

  readInt() {
    const value = this.buffer.getInt32(this.offset, false); // Big endian
    this.offset += 4;
    return value;
  }

  readLong() {
    // JavaScript doesn't natively support 64-bit integers
    // Read as two 32-bit integers and combine
    const high = this.buffer.getInt32(this.offset, false);
    const low = this.buffer.getUint32(this.offset + 4, false);
    this.offset += 8;
    // Return as BigInt for precision
    return (BigInt(high) << 32n) | BigInt(low);
  }

  readFloat() {
    const value = this.buffer.getFloat32(this.offset, false);
    this.offset += 4;
    return value;
  }

  readDouble() {
    const value = this.buffer.getFloat64(this.offset, false);
    this.offset += 8;
    return value;
  }

  readString() {
    const length = this.readShort();
    if (length <= 0) return '';
    
    const bytes = new Uint8Array(this.buffer.buffer, this.offset, length);
    this.offset += length;
    
    // Decode UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  }

  readByteArray() {
    const length = this.readInt();
    const array = new Int8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = this.readByte();
    }
    return array;
  }

  readIntArray() {
    const length = this.readInt();
    const array = new Int32Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = this.readInt();
    }
    return array;
  }

  readLongArray() {
    const length = this.readInt();
    const array = [];
    for (let i = 0; i < length; i++) {
      array.push(this.readLong());
    }
    return array;
  }

  readTag(tagType) {
    switch (tagType) {
      case TAG_END:
        return null;
      case TAG_BYTE:
        return this.readByte();
      case TAG_SHORT:
        return this.readShort();
      case TAG_INT:
        return this.readInt();
      case TAG_LONG:
        return this.readLong();
      case TAG_FLOAT:
        return this.readFloat();
      case TAG_DOUBLE:
        return this.readDouble();
      case TAG_BYTE_ARRAY:
        return this.readByteArray();
      case TAG_STRING:
        return this.readString();
      case TAG_LIST:
        return this.readList();
      case TAG_COMPOUND:
        return this.readCompound();
      case TAG_INT_ARRAY:
        return this.readIntArray();
      case TAG_LONG_ARRAY:
        return this.readLongArray();
      default:
        throw new Error(`Unknown tag type: ${tagType}`);
    }
  }

  readList() {
    const itemType = this.readUByte();
    const length = this.readInt();
    const list = [];
    
    for (let i = 0; i < length; i++) {
      list.push(this.readTag(itemType));
    }
    
    return list;
  }

  readCompound() {
    const compound = {};
    
    while (true) {
      const tagType = this.readUByte();
      
      if (tagType === TAG_END) {
        break;
      }
      
      const name = this.readString();
      const value = this.readTag(tagType);
      compound[name] = value;
    }
    
    return compound;
  }

  parse() {
    // Read root tag type (should be TAG_COMPOUND)
    const rootType = this.readUByte();
    
    if (rootType !== TAG_COMPOUND) {
      throw new Error(`Expected root tag to be COMPOUND, got ${rootType}`);
    }
    
    // Read root tag name
    const rootName = this.readString();
    
    // Read root compound
    const root = this.readCompound();
    
    return { name: rootName, value: root };
  }
}

/**
 * Parse a litematic file from an ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer - The raw file data
 * @returns {Object} The parsed NBT data
 */
export function parseLitematic(arrayBuffer) {
  // Decompress gzip data
  const compressed = new Uint8Array(arrayBuffer);
  let decompressed;
  
  try {
    decompressed = pako.inflate(compressed);
  } catch (e) {
    throw new Error('Failed to decompress litematic file: ' + e.message);
  }
  
  // Parse NBT data
  const reader = new NBTReader(decompressed.buffer);
  return reader.parse();
}

/**
 * Extract skin data from parsed litematic NBT
 * @param {Object} nbtData - Parsed NBT data
 * @returns {Array} Array of skin objects
 */
export function extractSkinsFromNBT(nbtData) {
  const skins = [];
  const seenTextures = new Set();
  
  const root = nbtData.value;
  
  // Litematic structure: root -> Regions -> [region name] -> BlockEntities
  const regions = root.Regions || root.regions || {};
  
  for (const regionName in regions) {
    const region = regions[regionName];
    
    // BlockEntities is a list of compound tags
    const blockEntities = region.BlockEntities || region.TileEntities || [];
    
    console.log(`Region "${regionName}": Found ${blockEntities.length} block entities`);
    
    for (const entity of blockEntities) {
      const skinData = extractSkinFromEntity(entity);
      
      if (skinData) {
        const key = skinData.textureValue || skinData.uuid || skinData.name;
        if (key && !seenTextures.has(key)) {
          skins.push(skinData);
          seenTextures.add(key);
          console.log('Found skin:', skinData.name || skinData.uuid || 'Unknown');
        }
      }
    }
  }
  
  return skins;
}

/**
 * Extract skin data from a block entity
 * @param {Object} entity - Block entity compound tag
 * @returns {Object|null} Skin data or null
 */
function extractSkinFromEntity(entity) {
  // Check if this is a skull block entity
  const id = entity.id || entity.Id || '';
  
  // Minecraft 1.20.2+ uses "profile" instead of "SkullOwner"
  // Earlier versions use "SkullOwner"
  const profile = entity.profile || entity.SkullOwner || entity.Owner;
  
  if (!profile) {
    return null;
  }
  
  // Also capture custom_name if available
  const customName = entity.custom_name || entity.CustomName || null;
  
  return parseProfile(profile, customName);
}

/**
 * Parse a profile/SkullOwner compound tag
 * @param {Object|string} profile - The profile data
 * @param {string|null} customName - Optional custom name from the block entity
 * @returns {Object|null} Skin data or null
 */
function parseProfile(profile, customName = null) {
  // Handle string-only profile (just a player name)
  if (typeof profile === 'string') {
    return {
      name: profile,
      customName,
      uuid: null,
      textureValue: null,
      textureSignature: null
    };
  }
  
  // Extract name
  const name = profile.Name || profile.name || null;
  
  // Extract UUID - can be in different formats
  let uuid = null;
  const id = profile.Id || profile.id || profile.UUID || profile.uuid;
  
  if (id) {
    if (Array.isArray(id)) {
      // UUID as int array [mostSigBits high, mostSigBits low, leastSigBits high, leastSigBits low]
      uuid = intArrayToUUID(id);
    } else if (typeof id === 'object' && id !== null) {
      // UUID as object with keys "0", "1", "2", "3"
      // e.g., { "0": -737154161, "1": 1675314149, "2": -1429125736, "3": -1059509461 }
      const idArray = [id["0"] || id[0], id["1"] || id[1], id["2"] || id[2], id["3"] || id[3]];
      if (idArray.every(v => v !== undefined)) {
        uuid = intArrayToUUID(idArray);
      }
    } else if (typeof id === 'string') {
      uuid = id;
    } else if (typeof id === 'bigint' || typeof id === 'number') {
      // Single long value (shouldn't happen for UUIDs, but handle it)
      uuid = id.toString(16);
    }
  }
  
  // Extract texture from Properties
  let textureValue = null;
  let textureSignature = null;
  
  const properties = profile.Properties || profile.properties;
  
  if (properties) {
    // Properties can be an array of objects with { name, value, signature }
    // Or a compound with "textures" list
    if (Array.isArray(properties)) {
      // New format: array of { name: "textures", value: "base64...", signature: "..." }
      const textureProperty = properties.find(p => p.name === 'textures' || p.Name === 'textures');
      if (textureProperty) {
        textureValue = textureProperty.Value || textureProperty.value;
        textureSignature = textureProperty.Signature || textureProperty.signature;
      }
    } else {
      // Old format: compound with textures list
      const textures = properties.textures || properties.Textures || [];
      
      if (Array.isArray(textures) && textures.length > 0) {
        const texture = textures[0];
        textureValue = texture.Value || texture.value;
        textureSignature = texture.Signature || texture.signature;
      }
    }
  }
  
  if (!name && !uuid && !textureValue) {
    return null;
  }
  
  return {
    name,
    customName,
    uuid,
    textureValue,
    textureSignature
  };
}

/**
 * Convert a UUID int array to string format
 * Minecraft stores UUIDs as 4 32-bit integers
 * @param {Array} intArray - Array of 4 integers
 * @returns {string} UUID string
 */
function intArrayToUUID(intArray) {
  if (!Array.isArray(intArray) || intArray.length !== 4) {
    return null;
  }
  
  // Convert each int to unsigned and then to hex
  const hex = intArray.map(n => {
    // Handle signed integers and BigInt
    let value = n;
    if (typeof n === 'bigint') {
      value = Number(n);
    }
    const unsigned = value >>> 0;
    return unsigned.toString(16).padStart(8, '0');
  }).join('');
  
  // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Decode a base64 texture value to get the skin URL
 * @param {string} textureValue - Base64 encoded texture data
 * @returns {Object|null} Decoded texture data or null
 */
export function decodeTextureValue(textureValue) {
  if (!textureValue) return null;
  
  try {
    const decoded = atob(textureValue);
    return JSON.parse(decoded);
  } catch (e) {
    console.warn('Failed to decode texture value:', e);
    return null;
  }
}
