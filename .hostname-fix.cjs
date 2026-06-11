// Workaround for Windows PC with non-ASCII hostname (M国) — Vercel CLI rejects it as HTTP header
const os = require('os');
os.hostname = function () { return 'MusclePC'; };
