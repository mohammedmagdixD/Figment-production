import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo, useDragControls } from 'motion/react';
import { Star, Loader2, ArrowLeft } from 'lucide-react';
import { SearchResult, getPodcastEpisodes, PodcastEpisode, getMovieDetails, getTvDetails, MovieDetails, getAnimeDetails, getMangaDetails, AnimeDetails, MangaDetails, getBookDetails } from '../services/api';
import { IOSDatePicker } from './IOSDatePicker';
import { haptics } from '../utils/haptics';
import { useScrollLock } from '../hooks/useScrollLock';
import { UniversalDetailCard } from './UniversalDetailCard';
import { 
  malAnimeAdapter, 
  malMangaAdapter, 
  tmdbMovieAdapter, 
  tmdbTvAdapter, 
  itunesPodcastAdapter, 
  googleBooksAdapter,
  itunesAudioAdapter,
  genericAdapter 
} from '../utils/adapters';
import { UniversalMediaData } from '../types/universal';

interface MediaDetailsModalProps {
  item: SearchResult & { rating?: number; dateAdded?: string; type?: string } | null;
  onClose: () => void;
  onLogEpisode?: (episode: PodcastEpisode, rating: number, date: string) => void;
}

export function MediaDetailsModal({ item, onClose, onLogEpisode }: MediaDetailsModalProps) {
  useScrollLock(!!item);

  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [animeDetails, setAnimeDetails] = useState<AnimeDetails | null>(null);
  const [mangaDetails, setMangaDetails] = useState<MangaDetails | null>(null);
  const [bookDetails, setBookDetails] = useState<any | null>(null);
  const [audioDetails, setAudioDetails] = useState<UniversalMediaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loggingEpisode, setLoggingEpisode] = useState<PodcastEpisode | null>(null);
  const [rating, setRating] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [sheetState, setSheetState] = useState<'half' | 'full'>('half');
  const controls = useAnimation();
  const dragControls = useDragControls();

  useEffect(() => {
    if (item) {
      setSheetState('half');
      controls.start('half');
      
      if (item.type === 'podcast') {
        setIsLoading(true);
        getPodcastEpisodes(item.id).then(data => {
          setEpisodes(data);
          setIsLoading(false);
        });
      } else if (item.type === 'movie') {
        setIsLoading(true);
        getMovieDetails(item.id).then(data => {
          setDetails(data);
          setIsLoading(false);
        });
      } else if (item.type === 'tv') {
        setIsLoading(true);
        getTvDetails(item.id).then(data => {
          setDetails(data);
          setIsLoading(false);
        });
      } else if (item.type === 'anime') {
        setIsLoading(true);
        getAnimeDetails(item.id).then(data => {
          setAnimeDetails(data);
          setIsLoading(false);
        });
      } else if (item.type === 'manga') {
        setIsLoading(true);
        getMangaDetails(item.id).then(data => {
          setMangaDetails(data);
          setIsLoading(false);
        });
      } else if (item.type === 'book' || item.type === 'webnovel') {
        setIsLoading(true);
        getBookDetails(item.id).then(data => {
          setBookDetails(data);
          setIsLoading(false);
        });
      } else if (item.type === 'song' || item.type === 'music') {
        setIsLoading(true);
        itunesAudioAdapter(item).then(data => {
          setAudioDetails(data);
          setIsLoading(false);
        });
      }
    }
  }, [item, controls]);

  if (!item) return null;

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  const handleLogEpisode = () => {
    haptics.success();
    onLogEpisode?.(loggingEpisode!, rating, date);
    setLoggingEpisode(null);
    onClose();
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocityY = info.velocity.y;
    const offsetY = info.offset.y;

    if (sheetState === 'half') {
      if (velocityY < -500 || offsetY < -50) {
        setSheetState('full');
        controls.start('full');
        haptics.light();
      } else if (velocityY > 500 || offsetY > 50) {
        handleClose();
      } else {
        controls.start('half');
      }
    } else if (sheetState === 'full') {
      if (velocityY > 500 || offsetY > 50) {
        handleClose();
      } else {
        controls.start('full');
      }
    }
  };

  const renderMediaContent = () => {
    if (loggingEpisode) {
      return (
        <div className="p-6 overflow-y-auto hide-scrollbar bg-[var(--system-background)] overlay-content flex flex-col h-full">
          <div className="flex items-center gap-4 mb-6">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              onClick={() => {
                haptics.light();
                setLoggingEpisode(null);
              }} 
              className="w-11 h-11 flex items-center justify-center bg-[var(--secondary-system-background)] rounded-full text-[var(--secondary-label)] hover:text-[var(--label)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h2 className="font-sf-pro-display text-[20px] font-semibold text-[var(--label)]">Log Episode</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="font-sf-pro font-semibold text-[16px] text-[var(--label)] line-clamp-2 mb-1">{loggingEpisode.title}</h3>
            <p className="font-sf-pro text-[14px] text-[var(--secondary-label)] line-clamp-2">{item.title}</p>
          </div>

          <div className="mb-8 px-1">
            <label className="block text-[14px] font-medium text-[var(--label)] mb-3">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button 
                  key={star} 
                  whileTap={{ scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 600, damping: 35 }}
                  onClick={() => {
                    haptics.light();
                    setRating(star);
                  }} 
                  className="focus:outline-none transition-transform"
                >
                  <Star className={`w-8 h-8 ${rating >= star ? 'fill-[var(--label)] text-[var(--label)]' : 'text-[var(--separator)] fill-transparent'}`} />
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-auto px-1">
            <label className="block text-[14px] font-medium text-[var(--label)] mb-3">Date</label>
            <IOSDatePicker 
              value={date} 
              onChange={setDate}
            />
          </div>

          <motion.button 
            whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.02 : 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 600, damping: 35 }}
            onClick={handleLogEpisode}
            className="w-full bg-[var(--label)] text-[var(--system-background)] rounded-xl py-4 font-medium text-[15px] hover:opacity-90 transition-colors mt-8"
          >
            Save to Diary
          </motion.button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-gray dark:text-ios-gray-1 animate-spin" />
        </div>
      );
    }

    let normalizedData: UniversalMediaData | null = null;

    if (item.type === 'movie' && details) {
      normalizedData = tmdbMovieAdapter(details, item);
    } else if (item.type === 'tv' && details) {
      normalizedData = tmdbTvAdapter(details, item);
    } else if (item.type === 'anime' && animeDetails) {
      normalizedData = malAnimeAdapter(animeDetails);
    } else if (item.type === 'manga' && mangaDetails) {
      normalizedData = malMangaAdapter(mangaDetails);
    } else if (item.type === 'podcast') {
      normalizedData = itunesPodcastAdapter(episodes, item, setLoggingEpisode, searchQuery, setSearchQuery);
    } else if ((item.type === 'book' || item.type === 'webnovel') && bookDetails) {
      normalizedData = googleBooksAdapter(bookDetails, item.type);
    } else if ((item.type === 'music' || item.type === 'song' || item.type === 'album') && audioDetails) {
      normalizedData = audioDetails;
    } else {
      normalizedData = genericAdapter(item);
    }

    if (!normalizedData) {
      return <div className="p-6 text-center text-gray dark:text-ios-gray-1">Failed to load details.</div>;
    }

    // Add user stats if available
    if (item.rating !== undefined || item.dateAdded) {
      normalizedData.userStats = {
        rating: item.rating,
        dateAdded: item.dateAdded
      };
    }

    return <UniversalDetailCard data={normalizedData} />;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            if (sheetState === 'half') handleClose();
          }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial="closed"
          animate={controls}
          exit="closed"
          variants={{
            closed: { y: '100%' },
            half: { y: '50%' },
            full: { y: '5%' }
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[var(--system-background)] rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:h-[85vh] sm:max-h-[850px]"
        >
          {/* Dash Icon for dragging */}
          <div 
            className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-3 pb-3 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="w-12 h-1.5 bg-[var(--tertiary-label)] rounded-full" />
          </div>

          <div 
            className={`flex-1 hide-scrollbar overlay-content ${sheetState === 'full' ? 'overflow-y-auto' : 'overflow-hidden'}`}
            onPointerDown={(e) => {
              if (sheetState === 'half') {
                dragControls.start(e);
              }
            }}
            onWheel={(e) => {
              if (sheetState === 'half' && e.deltaY > 0) {
                setSheetState('full');
                controls.start('full');
                haptics.light();
              }
            }}
          >
            {renderMediaContent()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
