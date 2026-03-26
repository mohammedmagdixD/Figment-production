import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Spotify Auth Token Cache
  let spotifyToken: string | null = null;
  let spotifyTokenExpiresAt = 0;

  async function getSpotifyToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    if (spotifyToken && Date.now() < spotifyTokenExpiresAt) {
      return spotifyToken;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        'User-Agent': 'ShelveApp/1.0'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to get Spotify token:', errText);
      throw new Error(`Failed to get Spotify token: ${response.status} ${errText}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      console.error('Spotify token response missing access_token:', data);
      throw new Error('Spotify token response missing access_token');
    }
    spotifyToken = data.access_token;
    spotifyTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // Expire 1 min early
    return spotifyToken;
  }

  // API Routes
  app.get('/api/search/spotify', async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      const type = (req.query.type as string || 'track').trim(); // Support 'track' or 'show'
      if (!query) return res.json({ results: [] });

      let token = await getSpotifyToken();
      let response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=15`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'User-Agent': 'ShelveApp/1.0'
        }
      });

      if (response.status === 401) {
        // Token might be expired or invalid, clear it and retry once
        spotifyToken = null;
        token = await getSpotifyToken();
        response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=15`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'ShelveApp/1.0'
          }
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 403) {
          // Gracefully handle 403 Forbidden (often "premium subscription required")
          // by returning empty results. This allows the frontend to seamlessly fall back to iTunes.
          return res.json({ results: [] });
        }
        console.error('Spotify API error response:', errText);
        throw new Error(`Spotify API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      let results = [];

      if (type === 'show' && data.shows) {
        results = data.shows.items.map((item: any) => ({
          id: item.id,
          title: item.name,
          subtitle: item.publisher,
          image: item.images[0]?.url || 'https://via.placeholder.com/600',
          url: item.external_urls.spotify,
          description: item.description
        }));
      } else if (data.tracks) {
        results = data.tracks.items.map((item: any) => ({
          id: item.id,
          title: item.name,
          subtitle: item.artists.map((a: any) => a.name).join(', '),
          image: item.album.images[0]?.url || 'https://via.placeholder.com/600',
          url: item.external_urls.spotify,
          previewUrl: item.preview_url // Note: Spotify often returns null for preview_url now
        }));
      }

      res.json({ results });
    } catch (error: any) {
      console.error('Spotify search error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // MAL API Proxy
  app.get('/api/mal/*', async (req, res) => {
    try {
      const endpoint = req.params[0];
      const queryParams = new URLSearchParams(req.query as any).toString();
      const url = `https://api.myanimelist.net/v2/${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      const clientId = process.env.MAL_CLIENT_ID || '6114d00ca681b7701d1e15fe11a4987e';
      
      const response = await fetch(url, {
        headers: {
          'X-MAL-CLIENT-ID': clientId
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('MAL API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
