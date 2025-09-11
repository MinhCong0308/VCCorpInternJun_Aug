// Fix the import - use the correct path relative to this file
const BaseOAuthProvider = require('./BaseOAuthProvider');

class GoogleOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super('google'); // Call the parent constructor with 'google' provider name
  }
  
  extractUserInfo(profile) {
    console.log("Extracting user info from Google profile AT EXTRACT PHRASE:", profile);
    const email = profile.emails[0].value;
    console.log("Extracted email:", email);
    const username = profile.displayName;
    console.log("Extracted username:", username);
    const firstName = profile.name?.givenName || 'NoFirstName';
    console.log("Extracted first name:", firstName);
    const lastName = profile.name?.familyName || 'NoLastName';
    console.log("Extracted last name:", lastName);
    const avatarUrl = profile.photos?.[0]?.value || null;
    console.log("Extracted avatar URL:", avatarUrl);
    return {
      email,
      username,
      firstName,
      lastName,
      avatarUrl
    };
  }
}

// Export the class directly
module.exports = GoogleOAuthProvider;