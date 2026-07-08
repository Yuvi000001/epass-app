const { v4: uuidv4 } = require('uuid');

// Format: EPASS-BGI-<YEAR>-<8 char random>  e.g. EPASS-BGI-2026-A1B2C3D4
function generatePassId() {
  const year = new Date().getFullYear();
  const short = uuidv4().split('-')[0].toUpperCase();
  return `EPASS-BGI-${year}-${short}`;
}

module.exports = generatePassId;
