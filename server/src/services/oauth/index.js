const YouTubeAdapter = require('./YouTubeAdapter');
const InstagramAdapter = require('./InstagramAdapter');
const TikTokAdapter = require('./TikTokAdapter');

const adapters = {
  youtube: new YouTubeAdapter(),
  instagram: new InstagramAdapter(),
  tiktok: new TikTokAdapter(),
};

const getAdapter = (provider) => {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }
  return adapter;
};

module.exports = { getAdapter, adapters };
