const crypto = require('crypto');
const { getAdapter } = require('../services/oauth');
const SocialAccount = require('../models/SocialAccount');
const InfluencerProfile = require('../models/InfluencerProfile');

/**
 * Initiates OAuth flow for a given provider.
 * GET /api/oauth/:provider/start
 */
exports.startOAuth = (req, res) => {
  try {
    const { provider } = req.params;
    const adapter = getAdapter(provider);
    const state = crypto.randomBytes(16).toString('hex');

    // Store state in session or short-lived token — for simplicity, encode userId
    const statePayload = Buffer.from(
      JSON.stringify({ userId: req.user._id, nonce: state })
    ).toString('base64url');

    const authUrl = adapter.getAuthUrl(statePayload);
    res.json({ authUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Handles OAuth callback from provider.
 * GET /api/oauth/:provider/callback?code=...&state=...
 */
exports.oauthCallback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const statePayload = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { userId } = statePayload;

    const adapter = getAdapter(provider);
    const tokens = await adapter.exchangeCode(code);
    const profile = await adapter.getProfile(tokens.accessToken);

    // Upsert social account
    await SocialAccount.findOneAndUpdate(
      { userId, provider },
      {
        providerUserId: profile.providerUserId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scopes: [],
        tokenStrategy: tokens.accessToken.startsWith('mock_') ? 'mock' : 'oauth2',
      },
      { upsert: true, new: true }
    );

    // Update influencer profile linked platforms
    await InfluencerProfile.findOneAndUpdate(
      { userId },
      {
        $pull: { linkedPlatforms: { provider } },
      }
    );
    await InfluencerProfile.findOneAndUpdate(
      { userId },
      {
        $push: {
          linkedPlatforms: {
            provider,
            providerUserId: profile.providerUserId,
            username: profile.username,
            followers: profile.followers,
          },
        },
      }
    );

    // Redirect back to frontend dashboard
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/influencer/profile?linked=${provider}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: 'OAuth flow failed' });
  }
};

/**
 * Unlinks a platform from the influencer's profile.
 * DELETE /api/oauth/:provider/unlink
 */
exports.unlinkPlatform = async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user._id;

    await SocialAccount.deleteOne({ userId, provider });
    await InfluencerProfile.findOneAndUpdate(
      { userId },
      { $pull: { linkedPlatforms: { provider } } }
    );

    res.json({ message: `${provider} unlinked successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unlink platform' });
  }
};
