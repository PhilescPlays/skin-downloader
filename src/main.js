import { extractSkinsFromLitematic, getSkinImageUrl, getSkinDownloadUrl } from './skin-extractor.js';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const skinsGrid = document.getElementById('skinsGrid');
const skinCount = document.getElementById('skinCount');
const noSkins = document.getElementById('noSkins');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// State
let currentFile = null;

// Initialize
function init() {
  setupDragAndDrop();
  setupFileInput();
  setupRetryButton();
}

// Setup drag and drop
function setupDragAndDrop() {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  dropZone.addEventListener('click', (e) => {
    // Avoid double-triggering when clicking on the label/button (which already triggers the input)
    if (e.target.closest('.file-input-label')) {
      return;
    }
    fileInput.click();
  });
}

// Setup file input
function setupFileInput() {
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
}

// Setup retry button
function setupRetryButton() {
  retryBtn.addEventListener('click', () => {
    resetUI();
  });
}

// Reset UI to initial state
function resetUI() {
  loadingSection.hidden = true;
  resultsSection.hidden = true;
  errorSection.hidden = true;
  dropZone.parentElement.hidden = false;
  fileInput.value = '';
  currentFile = null;
}

// Show error
function showError(message) {
  loadingSection.hidden = true;
  resultsSection.hidden = true;
  errorSection.hidden = false;
  dropZone.parentElement.hidden = true;
  errorMessage.textContent = message;
}

// Show loading
function showLoading() {
  dropZone.parentElement.hidden = true;
  loadingSection.hidden = false;
  resultsSection.hidden = true;
  errorSection.hidden = true;
}

// Show results
function showResults(skins) {
  loadingSection.hidden = true;
  errorSection.hidden = true;
  resultsSection.hidden = false;
  dropZone.parentElement.hidden = true;

  if (skins.length === 0) {
    skinsGrid.hidden = true;
    noSkins.hidden = false;
    skinCount.textContent = '0 skins found';
  } else {
    skinsGrid.hidden = false;
    noSkins.hidden = true;
    skinCount.textContent = `${skins.length} skin${skins.length !== 1 ? 's' : ''} found`;
    renderSkins(skins);
  }
}

// Handle file
async function handleFile(file) {
  if (!file.name.endsWith('.litematic')) {
    showError('Please select a valid .litematic file');
    return;
  }

  currentFile = file;
  showLoading();

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract skins from the litematic file using our custom NBT parser
    const skins = await extractSkinsFromLitematic(arrayBuffer);
    
    showResults(skins);
  } catch (error) {
    console.error('Error processing litematic file:', error);
    showError(`Failed to process file: ${error.message}`);
  }
}

// Render skins
function renderSkins(skins) {
  skinsGrid.innerHTML = '';

  skins.forEach((skin, index) => {
    const card = document.createElement('div');
    card.className = 'skin-card';
    
    const imageUrl = getSkinImageUrl(skin);
    const downloadUrl = getSkinDownloadUrl(skin);
    
    // Use customName if available (string or object), otherwise fall back to player name
    const displayName = getDisplayName(skin, index);
    
    card.innerHTML = `
      <img 
        class="skin-preview" 
        src="${imageUrl}" 
        alt="${displayName}"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect fill=%22%231a1a2e%22 width=%2264%22 height=%2264%22/><text x=%2232%22 y=%2236%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2216%22>?</text></svg>'"
      >
      <div class="skin-info">
        <div class="skin-name">${displayName}</div>
      </div>
      <div class="skin-actions">
        <a href="${downloadUrl}" target="_blank" class="btn btn-primary btn-small" download>
          Download
        </a>
        <button class="btn btn-secondary btn-small copy-btn" data-texture="${skin.textureValue || ''}">
          Copy
        </button>
      </div>
    `;

    // Setup copy button
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => copyToClipboard(skin, copyBtn));

    skinsGrid.appendChild(card);
  });
}

// Get a human-readable display name from a skin object
function getDisplayName(skin, index) {
  const { customName, name } = skin;

  if (customName) {
    // If CustomName is a text component object, use its "text" field
    if (typeof customName === 'object' && customName !== null) {
      if (typeof customName.text === 'string' && customName.text.trim() !== '') {
        return customName.text;
      }
    }

    // If CustomName is a simple string, use it directly
    if (typeof customName === 'string' && customName.trim() !== '') {
      return customName;
    }
  }

  if (typeof name === 'string' && name.trim() !== '') {
    return name;
  }

  return `Skin ${index + 1}`;
}

// Copy skin info to clipboard
async function copyToClipboard(skin, button) {
  // Always copy the direct skin URL
  const textToCopy = getSkinDownloadUrl(skin);
  
  try {
    await navigator.clipboard.writeText(textToCopy);
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.classList.add('btn-primary');
    button.classList.remove('btn-secondary');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('btn-primary');
      button.classList.add('btn-secondary');
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

// Start the app
init();
