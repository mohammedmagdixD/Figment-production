export type MediaType = 'movie' | 'music' | 'book' | 'anime' | 'manga' | 'webnovel' | 'podcast' | 'tv';

export interface Album {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  tracks: any[];
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  url?: string;
  previewUrl?: string; // For music previews
  description?: string; // For details modal
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration?: number;
  previewUrl?: string;
}

export interface MovieDetails {
  id: string;
  title: string;
  tagline: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  release_date: string;
  runtime: number;
  vote_average: number;
  genres: { id: number; name: string }[];
  director: string;
  contentRating: string;
  cast: { id: number; name: string; character: string; profile_path: string | null }[];
  trailerUrl: string | null;
  watchProviders: { provider_id: number; provider_name: string; logo_path: string }[];
  
  // TV Specific Fields
  last_air_date?: string;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  networks?: { id: number; name: string; logo_path: string | null }[];
  next_episode_to_air?: { air_date: string; name: string; season_number: number; episode_number: number } | null;
  seasons?: { id: number; season_number: number; name: string; episode_count: number; air_date: string; poster_path: string | null }[];
}

export async function getMovieDetails(id: string): Promise<MovieDetails | null> {
  try {
    const res = await fetch(`/api/tmdb/movie/${encodeURIComponent(id)}?append_to_response=credits,release_dates,watch%2Fproviders,videos`);
    if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
    const data = await res.json();

    // Find director
    const director = data.credits?.crew?.find((member: any) => member.job === 'Director')?.name || 'Unknown Director';

    // Find content rating (US certification)
    let contentRating = 'NR';
    const usRelease = data.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US');
    if (usRelease && usRelease.release_dates.length > 0) {
      const certification = usRelease.release_dates.find((d: any) => d.certification !== '')?.certification;
      if (certification) contentRating = certification;
    }

    // Find trailer
    const trailer = data.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(data.title + ' movie trailer')}`;

    // Find watch providers (US)
    const usProviders = data['watch/providers']?.results?.US;
    let watchProviders: any[] = [];
    if (usProviders) {
      // Combine flatrate, rent, and buy, then deduplicate
      const allProviders = [...(usProviders.flatrate || []), ...(usProviders.rent || []), ...(usProviders.buy || [])];
      const uniqueProviders = new Map();
      allProviders.forEach(p => {
        if (!uniqueProviders.has(p.provider_id)) {
          uniqueProviders.set(p.provider_id, p);
        }
      });
      watchProviders = Array.from(uniqueProviders.values()).slice(0, 5); // Limit to 5
    }

    return {
      id: data.id.toString(),
      title: data.title,
      tagline: data.tagline,
      overview: data.overview,
      backdrop_path: data.backdrop_path,
      poster_path: data.poster_path,
      release_date: data.release_date,
      runtime: data.runtime,
      vote_average: data.vote_average,
      genres: data.genres || [],
      director,
      contentRating,
      cast: (data.credits?.cast || []).slice(0, 10), // Top 10 cast members
      trailerUrl,
      watchProviders
    };
  } catch (e) {
    console.error('Failed to fetch movie details:', e);
    return null;
  }
}

export interface AnimeDetails {
  id: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string;
  image_url: string;
  large_image_url: string;
  backdrop_url: string | null;
  backdrop_fallback?: boolean;
  trailer_url: string | null;
  score: number | null;
  rank: number | null;
  popularity: number | null;
  season: string | null;
  year: number | null;
  type: string | null;
  episodes: number | null;
  status: string | null;
  studios: { mal_id: number; name: string }[];
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  source: string | null;
  theme_openings: string[];
  theme_endings: string[];
  characters: {
    character: { mal_id: number; name: string; image_url: string };
    role: string;
    voice_actor: { mal_id: number; name: string; image_url: string } | null;
  }[];
  related_anime?: any[];
  recommendations?: any[];
}

export interface MangaDetails {
  id: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string;
  image_url: string;
  large_image_url: string;
  backdrop_url: string | null;
  backdrop_fallback?: boolean;
  score: number | null;
  rank: number | null;
  popularity: number | null;
  type: string | null;
  chapters: number | null;
  volumes: number | null;
  status: string | null;
  authors: { mal_id: number; name: string }[];
  serializations: { mal_id: number; name: string }[];
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  characters: {
    character: { mal_id: number; name: string; image_url: string };
    role: string;
  }[];
}

async function fetchMAL(url: string): Promise<Response> {
  const proxyUrl = url.replace('https://api.myanimelist.net/v2/', '/api/mal/');
  return fetch(proxyUrl);
}

async function getKitsuCoverImage(malId: string, type: 'anime' | 'manga'): Promise<string | null> {
  try {
    const res = await fetch(`https://kitsu.app/api/edge/mappings?filter[externalSite]=myanimelist/${type}&filter[externalId]=${malId}&include=item`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.included && data.included.length > 0) {
      const coverImage = data.included[0].attributes?.coverImage;
      return coverImage?.original || coverImage?.large || null;
    }
  } catch (e) {
    console.error('Kitsu API error:', e);
  }
  return null;
}

export async function getAnimeDetails(id: string): Promise<AnimeDetails | null> {
  try {
    const url = `https://api.myanimelist.net/v2/anime/${id}?fields=id,title,main_picture,synopsis,genres,mean,rank,popularity,num_episodes,start_season,studios,alternative_titles,media_type,status,opening_themes,ending_themes,trailer,related_anime,recommendations`;
    
    const [res, kitsuCover] = await Promise.all([
      fetchMAL(url),
      getKitsuCoverImage(id, 'anime')
    ]);
    
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`MAL API error: ${res.status}`);
    
    const data = await res.json();
    
    let backdrop_url = kitsuCover;
    let backdrop_fallback = false;

    // Fallback 1: YouTube Thumbnail from MAL
    if (!backdrop_url && data.trailer?.images) {
      backdrop_url = data.trailer.images.maximum_image_url || data.trailer.images.large_image_url || null;
    }

    // Fallback 2: Heavy Blur
    if (!backdrop_url) {
      backdrop_url = data.main_picture?.large || data.main_picture?.medium || null;
      backdrop_fallback = true;
    }

    return {
      id: data.id.toString(),
      title: data.title,
      title_english: data.alternative_titles?.en || '',
      title_japanese: data.alternative_titles?.ja || '',
      synopsis: data.synopsis || '',
      image_url: data.main_picture?.medium || '',
      large_image_url: data.main_picture?.large || '',
      backdrop_url,
      backdrop_fallback,
      trailer_url: data.trailer?.youtube_id 
        ? `https://www.youtube.com/watch?v=${data.trailer.youtube_id}` 
        : (data.trailer?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(data.title + ' anime trailer')}`),
      score: data.mean,
      rank: data.rank,
      popularity: data.popularity,
      season: data.start_season?.season,
      year: data.start_season?.year,
      type: data.media_type,
      episodes: data.num_episodes,
      status: data.status,
      studios: data.studios || [],
      genres: data.genres || [],
      themes: [],
      source: '',
      theme_openings: data.opening_themes?.map((t: any) => t.text) || [],
      theme_endings: data.ending_themes?.map((t: any) => t.text) || [],
      characters: [],
      related_anime: data.related_anime || [],
      recommendations: data.recommendations || []
    };
  } catch (e) {
    console.error('Failed to fetch anime details:', e);
    return null;
  }
}

export async function getMangaDetails(id: string): Promise<MangaDetails | null> {
  try {
    const url = `https://api.myanimelist.net/v2/manga/${id}?fields=id,title,main_picture,synopsis,genres,mean,rank,popularity,num_chapters,num_volumes,authors,alternative_titles,media_type,status`;
    
    const [res, kitsuCover] = await Promise.all([
      fetchMAL(url),
      getKitsuCoverImage(id, 'manga')
    ]);
    
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`MAL API error: ${res.status}`);
    
    const data = await res.json();
    
    let backdrop_url = kitsuCover;
    let backdrop_fallback = false;

    // Fallback 1: Heavy Blur
    if (!backdrop_url) {
      backdrop_url = data.main_picture?.large || data.main_picture?.medium || null;
      backdrop_fallback = true;
    }

    return {
      id: data.id.toString(),
      title: data.title,
      title_english: data.alternative_titles?.en || '',
      title_japanese: data.alternative_titles?.ja || '',
      synopsis: data.synopsis || '',
      image_url: data.main_picture?.medium || '',
      large_image_url: data.main_picture?.large || '',
      backdrop_url,
      backdrop_fallback,
      score: data.mean,
      rank: data.rank,
      popularity: data.popularity,
      type: data.media_type,
      chapters: data.num_chapters,
      volumes: data.num_volumes,
      status: data.status,
      authors: data.authors?.map((a: any) => ({
        name: `${a.node.first_name} ${a.node.last_name}`.trim(),
        role: a.role
      })) || [],
      serializations: [],
      genres: data.genres || [],
      themes: [],
      characters: []
    };
  } catch (e) {
    console.error('Failed to fetch manga details:', e);
    return null;
  }
}

export async function getTvDetails(id: string): Promise<MovieDetails | null> {
  try {
    const res = await fetch(`/api/tmdb/tv/${id}?append_to_response=credits,content_ratings,watch/providers,videos`);
    if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
    const data = await res.json();

    // Find creator/director
    const director = data.created_by && data.created_by.length > 0 
      ? data.created_by.map((c: any) => c.name).join(', ') 
      : (data.credits?.crew?.find((member: any) => member.job === 'Director' || member.job === 'Executive Producer')?.name || 'Unknown Creator');

    // Find content rating (US certification)
    let contentRating = 'NR';
    const usRating = data.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US');
    if (usRating) {
      contentRating = usRating.rating;
    }

    // Find trailer
    const trailer = data.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(data.name + ' tv show trailer')}`;

    // Find watch providers (US)
    const usProviders = data['watch/providers']?.results?.US;
    let watchProviders: any[] = [];
    if (usProviders) {
      const allProviders = [...(usProviders.flatrate || []), ...(usProviders.rent || []), ...(usProviders.buy || [])];
      const uniqueProviders = new Map();
      allProviders.forEach(p => {
        if (!uniqueProviders.has(p.provider_id)) {
          uniqueProviders.set(p.provider_id, p);
        }
      });
      watchProviders = Array.from(uniqueProviders.values()).slice(0, 5);
    }

    return {
      id: data.id.toString(),
      title: data.name,
      tagline: data.tagline,
      overview: data.overview,
      backdrop_path: data.backdrop_path,
      poster_path: data.poster_path,
      release_date: data.first_air_date,
      runtime: data.episode_run_time?.[0] || 0,
      vote_average: data.vote_average,
      genres: data.genres || [],
      director,
      contentRating,
      cast: (data.credits?.cast || []).slice(0, 10),
      trailerUrl,
      watchProviders,
      
      // TV Specific
      last_air_date: data.last_air_date,
      status: data.status,
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      networks: data.networks || [],
      next_episode_to_air: data.next_episode_to_air,
      seasons: data.seasons || []
    };
  } catch (e) {
    console.error('Failed to fetch TV details:', e);
    return null;
  }
}

export async function getPodcastEpisodes(podcastId: string): Promise<PodcastEpisode[]> {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${podcastId}&media=podcast&entity=podcastEpisode&limit=50`);
    if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
    const data = await res.json();
    // The first result is the podcast itself, the rest are episodes
    return (data.results || []).slice(1).map((item: any) => ({
      id: item.trackId?.toString(),
      title: item.trackName,
      description: item.description || item.shortDescription || '',
      date: item.releaseDate,
      duration: item.trackTimeMillis,
      previewUrl: item.episodeUrl
    }));
  } catch (e) {
    console.error('Failed to fetch podcast episodes:', e);
    return [];
  }
}

export async function getBookDetails(id: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/books/volumes/${id}`);
    if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('Google Books API failed, trying OpenLibrary fallback', e);
    try {
      const res = await fetch(`https://openlibrary.org/works/${id}.json`);
      if (!res.ok) throw new Error(`OpenLibrary API error: ${res.status}`);
      const data = await res.json();
      
      let authorNames = ['Unknown Author'];
      if (data.authors && data.authors.length > 0) {
        try {
          const authorRes = await fetch(`https://openlibrary.org${data.authors[0].author.key}.json`);
          if (authorRes.ok) {
            const authorData = await authorRes.json();
            authorNames = [authorData.name];
          }
        } catch (authorErr) {
          console.warn('Failed to fetch author details from OpenLibrary', authorErr);
        }
      }

      return {
        id: id,
        volumeInfo: {
          title: data.title,
          authors: authorNames,
          description: typeof data.description === 'string' ? data.description : (data.description?.value || ''),
          imageLinks: {
            thumbnail: data.covers && data.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : null
          },
          publishedDate: data.first_publish_date,
          categories: data.subjects
        }
      };
    } catch (olErr) {
      console.error('Failed to fetch book details from OpenLibrary:', olErr);
      return null;
    }
  }
}

export async function searchMedia(query: string, type: MediaType): Promise<SearchResult[]> {
  if (!query) return [];
  
  try {
    if (type === 'podcast') {
      let results: SearchResult[] = [];
      // Try iTunes first
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&entity=podcast&limit=15`);
        if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
        const data = await res.json();
        results = (data.results || []).map((item: any) => ({
          id: item.collectionId?.toString(),
          title: item.collectionName,
          subtitle: item.artistName,
          image: item.artworkUrl600 || item.artworkUrl100?.replace('100x100bb', '600x600bb') || 'https://via.placeholder.com/600',
          url: item.collectionViewUrl,
          description: item.collectionName
        }));
      } catch (e) {
        console.warn('iTunes search failed, falling back to Spotify', e);
      }

      // Fallback to Spotify if no results
      if (results.length === 0) {
        try {
          const res = await fetch(`/api/search/spotify?q=${encodeURIComponent(query)}&type=show`);
          if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
          const data = await res.json();
          results = data.results || [];
        } catch (e) {
          console.error('Spotify search failed:', e);
        }
      }

      // Deduplicate podcasts by title and subtitle
      const seen = new Set();
      return results.filter(item => {
        const key = `${item.title}-${item.subtitle}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (type === 'music') {
      // Try Spotify first
      try {
        const res = await fetch(`/api/search/spotify?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results;
        }
      } catch (e) {
        console.warn('Spotify search failed or yielded no results, falling back to iTunes', e);
      }

      // Fallback to iTunes
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`);
        if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
        const data = await res.json();
        return (data.results || []).map((item: any) => ({
          id: item.trackId.toString(),
          title: item.trackName,
          subtitle: item.artistName,
          image: item.artworkUrl100?.replace('100x100bb', '600x600bb') || 'https://via.placeholder.com/600',
          url: item.trackViewUrl,
          previewUrl: item.previewUrl,
          description: item.collectionName
        }));
      } catch (e) {
        console.error('iTunes search failed:', e);
        return [];
      }
    }
    
    if (type === 'movie' || type === 'tv') {
      // Using TMDB API for reliable movie/tv search
      const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';
      const res = await fetch(`/api/tmdb/${endpoint}?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
      const data = await res.json();
      return (data.results || []).map((item: any) => ({
        id: item.id.toString(),
        title: item.title || item.name,
        subtitle: (item.release_date || item.first_air_date) ? (item.release_date || item.first_air_date).split('-')[0] : (type === 'movie' ? 'Movie' : 'TV Show'),
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/600',
        url: `https://www.themoviedb.org/${type}/${item.id}`,
        description: item.overview
      }));
    }

    if (type === 'book' || type === 'webnovel') {
      try {
        const res = await fetch(`/api/books/volumes?q=${encodeURIComponent(query + (type === 'webnovel' ? ' webnovel' : ''))}&maxResults=15&printType=books&orderBy=relevance`);
        if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);
        const data = await res.json();
        return (data.items || []).map((item: any) => {
          const info = item.volumeInfo;
          return {
            id: item.id,
            title: info.title,
            subtitle: info.authors ? info.authors.join(', ') : 'Unknown Author',
            image: info.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/300x400?text=No+Cover',
            url: info.infoLink,
            description: info.description
          };
        });
      } catch (e) {
        console.warn('Google Books API failed, falling back to OpenLibrary', e);
        try {
          const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query + (type === 'webnovel' ? ' webnovel' : ''))}&limit=15`);
          if (!res.ok) throw new Error(`OpenLibrary API error: ${res.status}`);
          const data = await res.json();
          return (data.docs || []).map((item: any) => ({
            id: item.key.replace('/works/', ''),
            title: item.title,
            subtitle: item.author_name ? item.author_name.join(', ') : 'Unknown Author',
            image: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : 'https://via.placeholder.com/300x400?text=No+Cover',
            url: `https://openlibrary.org${item.key}`,
            description: item.first_sentence ? (typeof item.first_sentence === 'string' ? item.first_sentence : item.first_sentence[0]) : ''
          }));
        } catch (olErr) {
          console.error(`Error searching ${type} on OpenLibrary:`, olErr);
          return [];
        }
      }
    }

    if (type === 'anime' || type === 'manga') {
      const url = `https://api.myanimelist.net/v2/${type}?q=${encodeURIComponent(query)}&limit=15&fields=id,title,main_picture,synopsis,mean,start_season,media_type`;
      const res = await fetchMAL(url);
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`MAL API error: ${res.status}`);
      const data = await res.json();
      return (data.data || []).map((item: any) => ({
        id: item.node.id.toString(),
        title: item.node.title,
        subtitle: item.node.start_season ? item.node.start_season.year.toString() : item.node.media_type,
        image: item.node.main_picture?.large || item.node.main_picture?.medium || 'https://via.placeholder.com/300x400?text=No+Cover',
        url: `https://myanimelist.net/${type}/${item.node.id}`,
        description: item.node.synopsis || ''
      }));
    }
  } catch (error) {
    console.error(`Error searching ${type}:`, error);
    return [];
  }
  return [];
}
