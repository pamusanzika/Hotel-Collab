/**
 * Base OAuth adapter interface.
 * All social platform adapters must implement these methods.
 *
 * When a platform's API is restricted or requires approval,
 * the adapter returns mock/placeholder data and logs a warning.
 */
class OAuthAdapter {
  constructor(provider) {
    this.provider = provider;
  }

  /** Returns the OAuth authorization URL to redirect the user to. */
  getAuthUrl(state) {
    throw new Error(`${this.provider}: getAuthUrl not implemented`);
  }

  /** Exchanges the authorization code for tokens. Returns { accessToken, refreshToken, expiresAt }. */
  async exchangeCode(code) {
    throw new Error(`${this.provider}: exchangeCode not implemented`);
  }

  /** Fetches the user's profile from the provider. Returns { providerUserId, username, followers }. */
  async getProfile(accessToken) {
    throw new Error(`${this.provider}: getProfile not implemented`);
  }
}

module.exports = OAuthAdapter;
