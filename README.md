# Litematic Skin Downloader

A client-side web application that extracts player skins from Minecraft `.litematic` files (Litematica schematic files).

## Features

- 🎮 **Drag & Drop Interface** - Simply drag your `.litematic` file into the browser
- 🔒 **Client-Side Processing** - All processing happens in your browser, no files are uploaded to any server
- 🖼️ **Skin Preview** - See previews of all player head skins found in the schematic
- 📥 **Download Skins** - Download the full skin texture for each player head
- 📋 **Copy Texture Data** - Copy texture values for use in commands or other tools

## How It Works

1. Upload a `.litematic` file (created by the Litematica mod)
2. The app parses the file to find all player head blocks
3. Extracts skin texture data from the block entities
4. Displays the skins with options to download or copy

## Usage

### Online

Visit the GitHub Pages deployment: [Your GitHub Pages URL]

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. The `dist` folder contains the static files ready for deployment

3. You can use GitHub Actions for automatic deployment, or manually push the `dist` folder to the `gh-pages` branch

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml` for automatic deployment on push to main.

## Technical Details

- Built with vanilla JavaScript and Vite
- Skin images fetched from [mc-heads.net](https://mc-heads.net/)

## Litematic File Format

Litematic files are NBT-compressed files used by the Litematica mod for Minecraft. They contain:
- Block data (block IDs and positions)
- Block entities (including player head texture data)
- Metadata (author, name, description)

Player heads with custom skins store their texture data in the `SkullOwner` NBT tag, which includes a base64-encoded JSON object containing the skin URL.

## License

MIT License
