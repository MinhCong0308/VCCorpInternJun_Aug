const oauthService = require('modules/oauth/services/oauthService');
const base_url = process.env.FRONTEND_URL || 'http://localhost:4200';
const oauthController = { 
  // Google OAuth callback
  // In oauthController.js
  googleCallback: async (req, res) => {
    try {
      const profile = req.user;
      console.log('Google profile:', profile);
      if (profile && profile.accessToken && profile.refreshToken) {
        const result = profile;
        // Set cookies
        res.cookie('accessToken', result.accessToken, { httpOnly: true });
        res.cookie('refreshToken', result.refreshToken, { httpOnly: true });
        
        // Redirect to frontend
        const base_url = process.env.FRONTEND_URL || 'http://localhost:4200';
        res.redirect(`${base_url}/login/success`);
        return;
      }      
      const result = await oauthService.handleOAuthSuccess(profile, 'google');
      
      res.cookie('accessToken', result.accessToken, { httpOnly: true });
      res.cookie('refreshToken', result.refreshToken, { httpOnly: true });
      
      const base_url = process.env.FRONTEND_URL || 'http://localhost:4200';
      res.redirect(`${base_url}/login/success`);
    } catch (error) {
      console.error('Google OAuth error:', error);
      const base_url = process.env.FRONTEND_URL || 'http://localhost:4200';
      res.redirect(`${base_url}/login/error`);
    }
  },
  
  // Facebook OAuth callback
  facebookCallback: async (req, res) => {
    try {
      const profile = req.user;
      const result = await oauthService.handleOAuthSuccess(profile, 'facebook');
      
      // Handle tokens
      res.cookie('accessToken', result.accessToken, { httpOnly: true });
      res.cookie('refreshToken', result.refreshToken, { httpOnly: true });
      
      res.redirect(`${process.env.FRONTEND_URL}/login/success`);
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login/error`);
    }
  },
  
  // GitHub OAuth callback
  githubCallback: async (req, res) => {
    try {
      const profile = req.user;
      const result = await oauthService.handleOAuthSuccess(profile, 'github');
      
      // Handle tokens
      res.cookie('accessToken', result.accessToken, { httpOnly: true });
      res.cookie('refreshToken', result.refreshToken, { httpOnly: true });
      
      res.redirect(`${process.env.FRONTEND_URL}/login/success`);
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login/error`);
    }
  }
};

module.exports = oauthController;