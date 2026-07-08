// =====================================================================
// E-PASS — Campus registration codes
// A new student must enter the correct code for their campus the first
// time they register. Override any of these via .env without touching code.
//   BIST  -> Bansal Institute of Science & Technology
//   BIRT  -> Bansal Institute of Research & Technology
//   BIRTS -> Bansal Institute of Research Technology & Science
// =====================================================================

const CAMPUS_CODES = {
  [(process.env.CAMPUS_CODE_BIST || 'Bist@#123').toLowerCase()]: 'BIST',
  [(process.env.CAMPUS_CODE_BIRT || 'Birt@#123').toLowerCase()]: 'BIRT',
  [(process.env.CAMPUS_CODE_BIRTS || 'Birts@#123').toLowerCase()]: 'BIRTS',
};

const VALID_CAMPUSES = ['BIST', 'BIRT', 'BIRTS'];

/** Returns the campus name for a given code, or null if the code is invalid. */
function resolveCampusFromCode(code) {
  if (!code) return null;
  return CAMPUS_CODES[String(code).trim().toLowerCase()] || null;
}

module.exports = { CAMPUS_CODES, VALID_CAMPUSES, resolveCampusFromCode };
