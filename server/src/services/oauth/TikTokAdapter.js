const OAuthAdapter = require('./OAuthAdapter');
const { TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, CLIENT_URL, SERVER_URL } = require('../../config/env');

const REDIRECT_URI = `${SERVER_URL}/api/oauth/tiktok/callback`;

/**
 * TikTok OAuth adapter using TikTok Login Kit v2.
 *
 * Status: RESTRICTED — TikTok's API requires developer application approval.
 * The Login Kit is available but follower count access requires additional
 * scopes (user.info.stats) that need approval.
 *
 * This adapter implements the real OAuth flow structure but falls back to
 * mock data when credentials are missing. Routes are production-ready
 * for when TikTok developer access is granted.
 */
class TikTokAdapter extends OAuthAdapter {
  constructor() {
    super('tiktok');
  }

  getAuthUrl(state) {
    if (!TIKTOK_CLIENT_KEY) {
      console.warn('[TikTokAdapter] Credentials not configured — using mock flow');
      return `${CLIENT_URL}/oauth/mock/tiktok?state=${state}`;
    }

    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      redirect_uri: REDIRECT_URI,
      scope: 'user.info.basic,user.info.stats',
      response_type: 'code',
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  }

  async exchangeCode(code) {
    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
      console.warn('[TikTokAdapter] Credentials missing — returning mock tokens');
      return { accessToken: 'mock_tt_access', refreshToken: 'mock_tt_refresh', expiresAt: null };
    }

    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token || '',
      refreshToken: data.refresh_token || '',
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
    };
  }

  async getProfile(accessToken) {
    if (accessToken === 'mock_tt_access') {
      return { providerUserId: 'mock_tt_001', username: 'MockTikToker', followers: 0 };
    }

    const res = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,follower_count',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    const user = data.data?.user;
    return {
      providerUserId: user?.open_id || '',
      username: user?.display_name || '',
      followers: user?.follower_count || 0,
    };
  }
}

module.exports = TikTokAdapter;
