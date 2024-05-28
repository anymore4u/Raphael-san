const axios = require('axios');

class TwitchAPI {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.token = '';
  }

  async getAccessToken() {
    const url = 'https://id.twitch.tv/oauth2/token';
    try {
      const response = await axios.post(url, null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials'
        }
      });
      this.token = response.data.access_token;
    } catch (error) {
      console.error('Error obtaining Twitch access token:', error);
    }
  }

  async checkStreamerStatus(streamerName) {
    if (!this.token) await this.getAccessToken();

    try {
      const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${streamerName}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = response.data.data;
      return data.length > 0 && data[0].type === 'live';
    } catch (error) {
      console.error('Error checking streamer status:', error);
      return false;
    }
  }
}

// Uso
const twitchClientId = 'ncl4z9vl557x0bg0xzw3b27fj77hfk';
const twitchClientSecret = '9h73oqhvie27ye2zi2y9n96dg0tru6';
const twitchAPI = new TwitchAPI(twitchClientId, twitchClientSecret);

twitchAPI.checkStreamerStatus('baiano').then(isLive => {
  console.log(isLive ? 'Streamer está ao vivo!' : 'Streamer está offline.');
});
