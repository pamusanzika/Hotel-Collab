const OAuthAdapter = require('./OAuthAdapter');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CLIENT_URL, SERVER_URL } = require('../../config/env');

const REDIRECT_URI = `${SERVER_URL}/api/oauth/youtube/callback`;

/**
 * YouTube OAuth adapter using Google's OAuth 2.0.
 *
 * Status: YouTube Data API v3 is publicly available.
 * Requires a Google Cloud project with YouTube Data API enabled.
 * Scopes: youtube.readonly for channel info + subscriber count.
 */
class YouTubeAdapter extends OAuthAdapter {
  constructor() {
    super('youtube');
  }

  getAuthUrl(state) {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[YouTubeAdapter] GOOGLE_CLIENT_ID not set — returning mock auth URL');
      return `${CLIENT_URL}/oauth/mock/youtube?state=${state}`;
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCode(code) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.warn('[YouTubeAdapter] Credentials missing — returning mock tokens');
      return { accessToken: 'mock_yt_access', refreshToken: 'mock_yt_refresh', expiresAt: null };
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
    };
  }

  async getProfile(accessToken) {
    if (accessToken === 'mock_yt_access') {
      return { providerUserId: 'mock_yt_001', username: 'MockYouTuber', followers: 0 };
    }

    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    const channel = data.items?.[0];
    return {
      providerUserId: channel?.id || '',
      username: channel?.snippet?.title || '',
      followers: parseInt(channel?.statistics?.subscriberCount || '0', 10),
    };
  }
}

module.exports = YouTubeAdapter;
