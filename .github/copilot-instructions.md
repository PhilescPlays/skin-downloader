# Litematic Skin Downloader - Copilot Instructions

## Project Overview
This is a client-side web application for extracting player skins from Minecraft .litematic files. The app runs entirely in the browser with no server-side processing.

## Tech Stack
- **Build Tool**: Vite
- **Language**: JavaScript (ES Modules)
- **Styling**: Vanilla CSS with custom properties
- **Key Dependencies**:
  - `@kleppe/litematic-reader` - Parses litematic NBT files
  - `pako` - For gzip decompression (used by litematic-reader)

## Project Structure
```
/
├── index.html          # Main HTML file
├── src/
│   ├── main.js         # Application entry point, UI logic
│   ├── skin-extractor.js  # Skin extraction logic from litematic data
│   └── style.css       # Application styles
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies and scripts
```

## Key Concepts

### Litematic Files
- Litematic files (.litematic) are NBT-compressed Minecraft schematic files
- They contain block data, block entities, and metadata
- Player heads store skin data in the `SkullOwner` NBT tag

### Skin Extraction
- Player heads are identified by block ID (minecraft:player_head, etc.)
- Skin textures are stored as base64-encoded JSON in the texture property
- The decoded JSON contains a URL to the actual skin texture

### External APIs
- Skin images are fetched from the Value of the skull after base64-decoding it
- No authentication required for these endpoints

## Development Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Coding Guidelines
- Keep all processing client-side
- Handle errors gracefully with user-friendly messages
- Use async/await for asynchronous operations
- Maintain pixelated rendering for Minecraft textures
