const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const verifyFirebaseTokenRules = [
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
];

// Example: if we had a manual login flow we'd validate email/password here.
// Since we are migrating to Firebase-only, the main auth endpoint just needs the Firebase token.

module.exports = {
  verifyFirebaseToken: validate(verifyFirebaseTokenRules)
};
