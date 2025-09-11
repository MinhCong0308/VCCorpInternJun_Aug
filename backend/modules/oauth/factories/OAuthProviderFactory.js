// Fix the import - use the correct path
const GoogleOAuthProvider = require('../providers/GoogleOAuthProvider');

class OAuthProviderFactory {
  static createProvider(providerName) {
    if (!providerName) {
      throw new Error("Provider name is required");
    }
    
    console.log(`Creating provider for: ${providerName}`);
    
    switch(providerName.toLowerCase()) {
      case 'google':
        console.log("Creating Google OAuth provider");
        return new GoogleOAuthProvider();
      // Other cases...
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }
}

module.exports = OAuthProviderFactory;