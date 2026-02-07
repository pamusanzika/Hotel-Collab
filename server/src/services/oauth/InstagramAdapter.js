const OAuthAdapter = require('./OAuthAdapter');
const { INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, CLIENT_URL, SERVER_URL } = require('../../config/env');

const REDIRECT_URI = `${SERVER_URL}/api/oauth/instagram/callback`;

/**
 * Instagram OAuth adapter using Instagram Basic Display API / Graph API.
 *
 * Status: RESTRICTED — Instagram Basic Display API was deprecated in late 2024.
 * The Instagram Graph API requires a Facebook Business account + App Review.
 * This adapter implements the real OAuth flow but will fall back to mock data
 * when credentials are not configured or the app hasn't passed review.
 *
 * To use for real:
 * 1. Create a Facebook Developer app
 * 2. Add Instagram Graph API product
 * 3. Submit for App Review with instagram_basic scope
 * 4. Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET
 */
class InstagramAdapter extends OAuthAdapter {
  constructor() {
    super('instagram');
  }

  getAuthUrl(state) {
    if (!INSTAGRAM_CLIENT_ID) {
      console.warn('[InstagramAdapter] Credentials not configured — using mock flow');
      return `${CLIENT_URL}/oauth/mock/instagram?state=${state}`;
    }

    const params = new URLSearchParams({
      client_id: INSTAGRAM_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'instagram_business_basic',
      response_type: 'code',
      state,
    });
    return `https://www.instagram.com/oauth/authorize?${params}`;
  }

  async exchangeCode(code) {
    if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
      console.warn('[InstagramAdapter] Credentials missing — returning mock tokens');
      return { accessToken: 'mock_ig_access', refreshToken: '', expiresAt: null };
    }

    const res = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token || '',
      refreshToken: '',
      expiresAt: null,
    };
  }

  async getProfile(accessToken) {
    if (accessToken === 'mock_ig_access') {
      return { providerUserId: 'mock_ig_001', username: 'MockInfluencer', followers: 0 };
    }

    const res = await fetch(
      `https://graph.instagram.com/me?fields=id,username,followers_count&access_token=${accessToken}`
    );
    const data = await res.json();
    return {
      providerUserId: data.id || '',
      username: data.username || '',
      followers: data.followers_count || 0,
    };
  }
}

module.exports = InstagramAdapter;
