import React from 'react';
import { UniversalMediaData } from '../types/universal';
import { ThemeSongItem } from '../components/ThemeSongItem';
import { UniversalListItem } from '../components/UniversalListItem';
import { motion } from 'motion/react';
import { haptics } from '../utils/haptics';
import { Search } from 'lucide-react';

export function malAnimeAdapter(data: any): UniversalMediaData {
  return {
    id: data.id.toString(),
    mediaType: 'anime',
    images: {
      backdropUrl: data.backdrop_url || data.large_image_url || data.image_url,
      posterUrl: data.image_url,
      backdropFallback: data.backdrop_fallback
    },
    header: {
      title: data.title_english || data.title,
      subtitle: data.studios?.map((s: any) => s.name).join(', ') || 'Unknown Studio'
    },
    stats: [
      { label: 'MAL Score', value: data.score },
      { label: 'Rank', value: data.rank ? `#${data.rank}` : null },
      { label: 'Popularity', value: data.popularity ? `#${data.popularity}` : null }
    ].filter(s => s.value !== null),
    metadata: [
      { label: 'Year', value: data.season ? `${data.season.charAt(0).toUpperCase() + data.season.slice(1)} ${data.year || ''}` : data.year },
      { label: 'Episodes', value: data.episodes ? `${data.episodes} Episodes` : 'Ongoing' },
      { label: 'Status', value: data.status }
    ].filter(m => m.value != null),
    description: data.synopsis,
    actionButton: data.trailer_url ? {
      type: 'trailer',
      payload: data.trailer_url
    } : undefined,
    scrollableSections: {
      genres: [...(data.genres || []), ...(data.themes || [])].map((g: any) => g.name || g),
      cast: data.characters?.map((c: any) => ({
        name: c.name,
        role: c.role,
        imageUrl: c.image_url
      })) || [],
      extras: [
        ...(data.theme_openings && data.theme_openings.length > 0 ? [{
          type: 'theme_songs',
          title: 'Openings',
          data: data.theme_openings.map((op: string, i: number) => <ThemeSongItem key={`op-${i}`} themeString={op} />)
        }] : []),
        ...(data.theme_endings && data.theme_endings.length > 0 ? [{
          type: 'theme_songs',
          title: 'Endings',
          data: data.theme_endings.map((ed: string, i: number) => <ThemeSongItem key={`ed-${i}`} themeString={ed} />)
        }] : []),
        ...(data.source ? [{
          type: 'source',
          title: 'Source Material',
          data: <p className="font-sf-pro text-[15px] text-[var(--secondary-label)]">Adapted from {data.source}</p>
        }] : [])
      ]
    }
  };
}

export function malMangaAdapter(data: any): UniversalMediaData {
  return {
    id: data.id.toString(),
    mediaType: 'manga',
    images: {
      backdropUrl: data.backdrop_url || data.large_image_url || data.image_url,
      posterUrl: data.image_url,
      backdropFallback: data.backdrop_fallback
    },
    header: {
      title: data.title_english || data.title,
      subtitle: data.authors?.map((a: any) => a.name).join(', ') || 'Unknown Author'
    },
    stats: [
      { label: 'MAL Score', value: data.score },
      { label: 'Rank', value: data.rank ? `#${data.rank}` : null },
      { label: 'Popularity', value: data.popularity ? `#${data.popularity}` : null }
    ].filter(s => s.value !== null),
    metadata: [
      { label: 'Published', value: data.published?.string },
      { label: 'Chapters', value: data.chapters ? `${data.chapters} Chapters` : (data.volumes ? `${data.volumes} Volumes` : 'Ongoing') },
      { label: 'Status', value: data.status }
    ].filter(m => m.value != null),
    description: data.synopsis,
    scrollableSections: {
      genres: [...(data.genres || []), ...(data.themes || [])].map((g: any) => g.name || g),
      cast: data.characters?.map((c: any) => ({
        name: c.name,
        role: c.role,
        imageUrl: c.image_url
      })) || [],
      extras: []
    }
  };
}

export function tmdbMovieAdapter(data: any, item: any): UniversalMediaData {
  const startYear = data.release_date?.split('-')[0];
  return {
    id: data.id.toString(),
    mediaType: 'movie',
    images: {
      backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : item.image,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : item.image,
      backdropFallback: !data.backdrop_path
    },
    header: {
      title: data.title || data.name,
      subtitle: data.director || 'Unknown Director'
    },
    tagline: data.tagline,
    stats: [
      { label: 'TMDB', value: data.vote_average ? data.vote_average.toFixed(1) : null },
    ].filter(s => s.value !== null),
    metadata: [
      { label: 'Year', value: startYear },
      { label: 'Runtime', value: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : null },
      { label: 'MPA', value: data.contentRating !== 'NR' ? data.contentRating : null },
    ].filter(m => m.value != null),
    description: data.overview,
    actionButton: data.trailerUrl ? {
      type: 'trailer',
      payload: data.trailerUrl
    } : undefined,
    scrollableSections: {
      genres: data.genres?.map((g: any) => g.name) || [],
      cast: data.cast?.map((c: any) => ({
        name: c.name,
        role: c.character,
        imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
      })) || [],
      watchProviders: data.watchProviders || [],
      extras: []
    }
  };
}

export function tmdbTvAdapter(data: any, item: any): UniversalMediaData {
  const startYear = data.first_air_date?.split('-')[0];
  const endYear = data.last_air_date?.split('-')[0];
  const isEnded = data.status === 'Ended' || data.status === 'Canceled';
  
  let yearDisplay = startYear;
  if (startYear) {
    if (isEnded) {
      if (endYear && startYear !== endYear) {
        yearDisplay = `${startYear}–${endYear}`;
      } else {
        yearDisplay = startYear;
      }
    } else {
      yearDisplay = `${startYear}–Present`;
    }
  }

  return {
    id: data.id.toString(),
    mediaType: 'tv',
    images: {
      backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : item.image,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : item.image,
      backdropFallback: !data.backdrop_path
    },
    header: {
      title: data.title || data.name,
      subtitle: data.director || 'Unknown Creator'
    },
    tagline: data.tagline,
    stats: [
      { label: 'TMDB', value: data.vote_average ? data.vote_average.toFixed(1) : null },
    ].filter(s => s.value !== null),
    metadata: [
      { label: 'Year', value: yearDisplay },
      { label: 'Seasons', value: data.number_of_seasons ? `${data.number_of_seasons} Season${data.number_of_seasons > 1 ? 's' : ''}` : null },
      { label: 'MPA', value: data.contentRating !== 'NR' ? data.contentRating : null },
      { label: 'Status', value: isEnded ? 'Finished' : 'Ongoing' }
    ].filter(m => m.value != null),
    description: data.overview,
    actionButton: data.trailerUrl ? {
      type: 'trailer',
      payload: data.trailerUrl
    } : undefined,
    scrollableSections: {
      genres: data.genres?.map((g: any) => g.name) || [],
      cast: data.cast?.map((c: any) => ({
        name: c.name,
        role: c.character,
        imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
      })) || [],
      watchProviders: data.watchProviders || [],
      extras: [
        ...(data.seasons && data.seasons.length > 0 ? [{
          type: 'seasons',
          title: 'Seasons',
          data: data.seasons.filter((s: any) => s.season_number > 0).map((season: any) => (
            <UniversalListItem 
              key={season.id}
              title={season.name}
              subtitle={`${season.air_date?.split('-')[0]} • ${season.episode_count} Episodes`}
              imageUrl={season.poster_path ? `https://image.tmdb.org/t/p/w185${season.poster_path}` : null}
              icon="tv"
              imageStyle="vertical"
              rightContent={
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 600, damping: 35 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.light();
                  }}
                  className="shrink-0 text-[12px] font-medium bg-[var(--system-background)] border border-[var(--separator)] px-3 py-1.5 rounded-full hover:bg-[var(--tertiary-system-background)] text-[var(--label)] transition-colors"
                >
                  Rate
                </motion.button>
              }
            />
          ))
        }] : [])
      ]
    }
  };
}

export function itunesPodcastAdapter(
  episodes: any[], 
  item: any, 
  onLogEpisode: (ep: any) => void,
  searchQuery: string,
  setSearchQuery: (query: string) => void
): UniversalMediaData {
  const filteredEpisodes = episodes.filter(ep => 
    ep.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ep.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    id: item.id.toString(),
    mediaType: 'podcast',
    images: {
      backdropUrl: item.image,
      posterUrl: item.image,
      backdropFallback: true
    },
    header: {
      title: item.title,
      subtitle: item.subtitle
    },
    stats: [],
    metadata: [
      { label: 'Format', value: 'Podcast' }
    ],
    description: item.description,
    scrollableSections: {
      extras: [
        ...(episodes && episodes.length > 0 ? [{
          type: 'episodes',
          title: 'Episodes',
          data: [
            <div key="search-bar" className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-label)]" />
              <input
                type="text"
                placeholder="Search episodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--secondary-system-background)] border border-[var(--separator)] rounded-xl py-2 pl-9 pr-3 text-[15px] font-sf-pro text-[var(--label)] placeholder:text-[var(--secondary-label)] focus:outline-none focus:ring-2 focus:ring-[var(--label)]/10 transition-all"
              />
            </div>,
            ...filteredEpisodes.map((ep: any) => (
              <UniversalListItem 
                key={ep.id}
                title={ep.title}
                subtitle={new Date(ep.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                imageUrl={item.image}
                icon="music"
                imageStyle="square"
                onClick={() => onLogEpisode(ep)}
                rightContent={
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.light();
                      onLogEpisode(ep);
                    }}
                    className="shrink-0 text-[12px] font-medium bg-[var(--system-background)] border border-[var(--separator)] px-3 py-1.5 rounded-full hover:bg-[var(--tertiary-system-background)] text-[var(--label)] transition-colors"
                  >
                    Rate
                  </motion.button>
                }
              />
            ))
          ]
        }] : [])
      ]
    }
  };
}

export function googleBooksAdapter(data: any, type: string = 'book'): UniversalMediaData {
  const info = data.volumeInfo || {};
  const access = data.accessInfo || {};
  
  // Image handling
  let imageUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || 'https://via.placeholder.com/300x400?text=No+Cover';
  imageUrl = imageUrl.replace('http:', 'https:');
  // Try to get a higher resolution image by removing zoom or setting it to 3
  if (imageUrl.includes('&zoom=')) {
    imageUrl = imageUrl.replace(/&zoom=\d+/, '&zoom=3');
  } else if (imageUrl.includes('?id=')) {
    imageUrl += '&zoom=3';
  }

  // Description handling: strip HTML tags
  const rawDescription = info.description || '';
  const cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '');

  const stats = [];
  if (info.averageRating) {
    stats.push({ label: 'Rating', value: info.averageRating.toString() });
  }
  if (info.pageCount) {
    stats.push({ label: 'Pages', value: `${info.pageCount} Pages` });
  }
  if (info.publishedDate) {
    stats.push({ label: 'Published', value: info.publishedDate.substring(0, 4) });
  }

  const metadata = [];
  if (info.publisher) {
    metadata.push({ label: 'Publisher', value: info.publisher });
  }
  if (info.categories && info.categories.length > 0) {
    metadata.push({ label: 'Categories', value: info.categories.join(', ') });
  }
  metadata.push({ label: 'Format', value: type === 'webnovel' ? 'Webnovel' : 'Book' });

  const extras = [];
  if (info.industryIdentifiers) {
    info.industryIdentifiers.forEach((id: any) => {
      extras.push({ label: id.type.replace('_', ' '), value: id.identifier });
    });
  }
  if (info.language) {
    extras.push({ label: 'Language', value: info.language.toUpperCase() });
  }

  return {
    id: data.id.toString(),
    mediaType: type as any,
    images: {
      backdropUrl: imageUrl,
      posterUrl: imageUrl,
      backdropFallback: true
    },
    header: {
      title: info.title || 'Unknown Title',
      subtitle: info.authors ? info.authors.join(', ') : 'Unknown Author'
    },
    stats,
    metadata,
    description: cleanDescription,
    actionButton: access.webReaderLink ? {
      type: 'read',
      payload: access.webReaderLink,
      label: 'Read Sample'
    } : undefined,
    scrollableSections: {
      genres: info.categories || [],
      extras
    }
  };
}

function mapItunesTrack(trackDetails: any, item: any, backdropUrl: string | null, backdropFallback: boolean, actionButton: any): UniversalMediaData {
  const duration = trackDetails?.trackTimeMillis 
    ? `${Math.floor(trackDetails.trackTimeMillis / 60000)}:${Math.floor((trackDetails.trackTimeMillis % 60000) / 1000).toString().padStart(2, '0')}` 
    : null;

  return {
    id: trackDetails?.trackId?.toString() || item.id?.toString() || '',
    mediaType: item.type || 'song',
    images: {
      backdropUrl,
      posterUrl: trackDetails?.artworkUrl100?.replace('100x100bb', '600x600bb') || item.image || '',
      backdropFallback
    },
    header: {
      title: trackDetails?.trackName || item.title || '',
      subtitle: trackDetails?.artistName || item.subtitle || ''
    },
    stats: [
      trackDetails?.trackNumber && trackDetails?.trackCount ? { label: 'Track Placement', value: `Track ${trackDetails.trackNumber} of ${trackDetails.trackCount}` } : null,
      trackDetails?.trackExplicitness === 'explicit' ? { label: 'Explicitness', value: 'Explicit' } : null
    ].filter((s): s is {label: string; value: string} => s !== null),
    metadata: [
      trackDetails?.releaseDate ? { label: 'Release Year', value: new Date(trackDetails.releaseDate).getFullYear().toString() } : null,
      trackDetails?.primaryGenreName ? { label: 'Genre', value: trackDetails.primaryGenreName } : null,
      duration ? { label: 'Duration', value: duration } : null
    ].filter((m): m is {label: string; value: string} => m != null),
    description: trackDetails?.collectionName || item.description || '',
    actionButton: actionButton,
    secondaryActionButton: (trackDetails?.previewUrl || item.previewUrl) ? {
      type: 'audio',
      payload: trackDetails?.previewUrl || item.previewUrl
    } : undefined,
    scrollableSections: {
      extras: [
        ...(trackDetails?.country || trackDetails?.copyright ? [{
          type: 'copyright',
          title: '',
          data: (
            <div className="text-[12px] text-[var(--tertiary-label)] text-center mt-4">
              {trackDetails?.country && <p>Country of Origin: {trackDetails.country}</p>}
              {trackDetails?.copyright && <p>{trackDetails.copyright}</p>}
            </div>
          )
        }] : [])
      ]
    }
  };
}

export async function itunesAudioAdapter(item: any): Promise<UniversalMediaData> {
  let backdropUrl: string | null = null;
  let backdropFallback = false;
  let actionButton: any = undefined;

  const artistName = item.subtitle || item.header?.subtitle || '';
  const trackName = item.title || item.header?.title || '';

  // Step 1: YouTube Data API
  try {
    const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' ' + trackName + ' official audio')}&type=video&key=${import.meta.env.VITE_YOUTUBE_API_KEY || ''}`);
    if (ytRes.ok) {
      const ytData = await ytRes.json();
      if (ytData.items && ytData.items.length > 0) {
        const videoId = ytData.items[0].id.videoId;
        backdropUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        actionButton = {
          type: 'trailer',
          payload: `https://www.youtube.com/watch?v=${videoId}`
        };
      }
    } else {
      throw new Error('YouTube API failed');
    }
  } catch (e) {
    console.error('YouTube API failed, trying Piped fallback', e);
    try {
      // Piped API fallback
      const pipedRes = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(artistName + ' ' + trackName + ' official audio')}&filter=videos`);
      if (pipedRes.ok) {
        const pipedData = await pipedRes.json();
        if (pipedData.items && pipedData.items.length > 0) {
          const videoId = pipedData.items[0].url.split('?v=')[1];
          backdropUrl = pipedData.items[0].thumbnail;
          actionButton = {
            type: 'trailer',
            payload: `https://www.youtube.com/watch?v=${videoId}`
          };
        }
      }
    } catch (pipedErr) {
      console.error('Piped API failed', pipedErr);
    }
  }

  // Step 2: TheAudioDB
  if (!backdropUrl) {
    try {
      const adbRes = await fetch(`https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(artistName)}`);
      if (adbRes.ok) {
        const adbData = await adbRes.json();
        if (adbData.artists && adbData.artists.length > 0 && adbData.artists[0].strArtistFanart) {
          backdropUrl = adbData.artists[0].strArtistFanart;
        }
      }
    } catch (e) {
      console.error('TheAudioDB API failed', e);
    }
  }

  // Step 3: iTunes square album art (Fallback 2)
  if (!backdropUrl) {
    const imageUrl = item.image || item.images?.posterUrl;
    backdropUrl = imageUrl?.replace('100x100bb', '600x600bb') || imageUrl;
    backdropFallback = true;
  }

  let trackDetails: any = null;
  try {
    const itunesRes = await fetch(`https://itunes.apple.com/lookup?id=${item.id}`);
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      if (itunesData.results && itunesData.results.length > 0) {
        trackDetails = itunesData.results[0];
      }
    }
  } catch (e) {
    console.error('iTunes lookup failed', e);
  }

  const mappedData = mapItunesTrack(trackDetails, item, backdropUrl, backdropFallback, actionButton);

  // Step 4: Fetch related items (Album Tracks and Artist Tracks)
  const relatedLists: { listTitle: string; items: UniversalMediaData[] }[] = [];
  
  if (trackDetails?.collectionId) {
    try {
      const albumRes = await fetch(`https://itunes.apple.com/lookup?id=${trackDetails.collectionId}&entity=song`);
      if (albumRes.ok) {
        const albumData = await albumRes.json();
        const albumTracks = albumData.results.filter((res: any) => res.wrapperType === 'track' && res.trackId !== trackDetails.trackId);
        
        if (albumTracks.length > 0) {
          relatedLists.push({
            listTitle: "More from this Album",
            items: albumTracks.map((track: any) => mapItunesTrack(track, { type: 'song' }, null, true, undefined))
          });
        }
      }
    } catch (e) {
      console.error('iTunes album lookup failed', e);
    }
  }

  if (trackDetails?.artistId) {
    try {
      const artistRes = await fetch(`https://itunes.apple.com/lookup?id=${trackDetails.artistId}&entity=song&limit=11`);
      if (artistRes.ok) {
        const artistData = await artistRes.json();
        const artistTracks = artistData.results.filter((res: any) => res.wrapperType === 'track' && res.trackId !== trackDetails.trackId).slice(0, 10);
        
        if (artistTracks.length > 0) {
          relatedLists.push({
            listTitle: "More from this Artist",
            items: artistTracks.map((track: any) => mapItunesTrack(track, { type: 'song' }, null, true, undefined))
          });
        }
      }
    } catch (e) {
      console.error('iTunes artist lookup failed', e);
    }
  }

  mappedData.relatedLists = relatedLists;

  return mappedData;
}

export function genericAdapter(item: any): UniversalMediaData {
  return {
    id: item.id.toString(),
    mediaType: item.type,
    images: {
      backdropUrl: item.image,
      posterUrl: item.image,
      backdropFallback: true
    },
    header: {
      title: item.title,
      subtitle: item.subtitle
    },
    stats: [],
    metadata: [
      { label: 'Format', value: item.type.charAt(0).toUpperCase() + item.type.slice(1) }
    ],
    description: item.description,
    actionButton: item.url ? {
      type: 'link',
      payload: item.url
    } : undefined,
    scrollableSections: {
      extras: []
    }
  };
}
