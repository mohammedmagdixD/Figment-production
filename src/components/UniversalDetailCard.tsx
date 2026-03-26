import { motion } from 'motion/react';
import { Play, Star, ExternalLink, Headphones, BookOpen, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { UniversalMediaData } from '../types/universal';
import { useState, useRef } from 'react';
import { MediaCard } from './MediaCard';
import { MediaDetailsModal } from './MediaDetailsModal';

interface UniversalDetailCardProps {
  data: UniversalMediaData;
}

export function UniversalDetailCard({ data }: UniversalDetailCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (url: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
    }
  };

  return (
    <div className="flex flex-col pb-8">
      {/* 1. Hero Section */}
      <div className="relative w-full aspect-[16/9] bg-black shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={data.images.backdropUrl || data.images.posterUrl} 
            alt={data.header.title} 
            className={`w-full h-full object-cover ${data.images.backdropFallback ? 'opacity-80 blur-[40px] scale-125' : 'opacity-90'}`}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--system-background)] via-[var(--system-background)]/20 to-transparent" />
        
        {data.actionButton && (
          <a 
            href={data.actionButton.payload}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex flex-col items-center justify-center group"
          >
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-black/60 transition-colors">
              {data.actionButton.type === 'trailer' && <Play className="w-8 h-8 text-white fill-white ml-1" />}
              {data.actionButton.type === 'audio' && <Headphones className="w-8 h-8 text-white" />}
              {data.actionButton.type === 'read' && <BookOpen className="w-8 h-8 text-white" />}
              {data.actionButton.type === 'link' && <ExternalLink className="w-8 h-8 text-white" />}
            </div>
            {data.actionButton.label && (
              <span className="mt-2 text-white text-sm font-medium drop-shadow-md">
                {data.actionButton.label}
              </span>
            )}
          </a>
        )}

        <div className="absolute -bottom-16 left-6 flex items-end gap-4">
          <div className={`w-28 ${(data.mediaType === 'song' || data.mediaType === 'music') ? 'aspect-square' : 'aspect-[2/3]'} rounded-xl overflow-hidden shadow-xl border-2 border-[var(--system-background)] shrink-0 bg-[var(--secondary-system-background)]`}>
            <img 
              src={data.images.posterUrl} 
              alt={data.header.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* 2. Primary Information Section */}
      <div className="pt-20 px-6">
        {(data.userStats?.rating !== undefined || data.userStats?.dateAdded) && (
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[var(--separator)]">
            {data.userStats.rating !== undefined && (
              <div>
                <div className="text-[12px] font-medium text-[var(--secondary-label)] uppercase tracking-wider mb-1.5">Your Rating</div>
                <div className="flex items-center gap-1 text-[var(--label)]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < data.userStats!.rating! ? 'fill-current' : 'text-[var(--separator)] fill-transparent'}`} />
                  ))}
                </div>
              </div>
            )}
            {data.userStats.dateAdded && (
              <div>
                <div className="text-[12px] font-medium text-[var(--secondary-label)] uppercase tracking-wider mb-1.5">Date Added</div>
                <div className="flex items-center gap-1.5 text-[var(--label)] font-medium text-[14px]">
                  <Calendar className="w-4 h-4 text-[var(--secondary-label)]" />
                  {new Date(data.userStats.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <h2 className="font-sf-pro text-[24px] font-bold leading-[120%] text-[var(--label)] mb-1">
            {data.header.title}
          </h2>
          {data.header.subtitle && (
            <p className="font-sf-pro text-[16px] text-[var(--secondary-label)]">
              {data.header.subtitle}
            </p>
          )}
          {data.secondaryActionButton?.type === 'audio' && (
            <div className="mt-4">
              <audio controls className="w-full h-10 rounded-full" src={data.secondaryActionButton.payload}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        {/* Stats & Metadata in a single line */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6 text-[15px] font-medium text-[var(--secondary-label)]">
          {data.metadata.map((meta, i) => (
            <div key={`meta-${i}`} className="flex items-center gap-2.5">
              {i > 0 && <span>•</span>}
              {meta.label === 'MPA' ? (
                <span className="px-1.5 py-0.5 border border-[var(--secondary-label)] rounded-[4px] text-[12px] leading-none font-semibold uppercase tracking-wider">
                  {meta.value}
                </span>
              ) : (
                <span>{meta.value}</span>
              )}
            </div>
          ))}
          {data.stats.map((stat, i) => (
            <div key={`stat-${i}`} className="flex items-center gap-2.5">
              {(data.metadata.length > 0 || i > 0) && <span>•</span>}
              <div className="flex items-center gap-1">
                {(stat.label.toLowerCase().includes('rating') || stat.label.toLowerCase().includes('score') || stat.label.toLowerCase().includes('tmdb')) && (
                  <Star className="w-4 h-4" />
                )}
                <span>{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Where to Watch */}
        {data.scrollableSections.watchProviders && data.scrollableSections.watchProviders.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              {data.scrollableSections.watchProviders.map((provider: any, i: number) => (
                <div key={i} className="w-[52px] h-[52px] rounded-[12px] overflow-hidden bg-[var(--secondary-system-background)] border border-[var(--separator)] flex items-center justify-center">
                  <img src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} alt={provider.provider_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Synopsis */}
        {data.description && (
          <div className="mb-8">
            {data.tagline && (
              <p className="font-sf-pro text-[16px] font-medium text-[var(--label)] mb-2">
                {data.tagline}
              </p>
            )}
            {(data.mediaType === 'song' || data.mediaType === 'music') ? (
              <p className="font-sf-pro text-[18px] font-bold leading-[140%] text-[var(--label)]">
                {data.description}
              </p>
            ) : (
              <div className="relative">
                <p className={`font-sf-pro text-[15px] leading-[150%] text-[var(--secondary-label)] ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                  {data.description}
                </p>
                <button 
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-[15px] font-medium text-[var(--ios-blue)] mt-1 flex items-center gap-1"
                >
                  {isDescriptionExpanded ? 'Less' : 'More'}
                  {isDescriptionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Genres */}
        {data.scrollableSections.genres && data.scrollableSections.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {data.scrollableSections.genres.map((genre, i) => (
              <span key={i} className="px-3 py-1 bg-[var(--secondary-system-background)] text-[var(--label)] rounded-full text-[13px] font-medium">
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* 4. Cast */}
        {data.scrollableSections.cast && data.scrollableSections.cast.length > 0 && (
          <div className="mb-8">
            <h3 className="font-sf-pro text-[20px] font-bold text-[var(--label)] mb-4">Cast & Characters</h3>
            <div className="horizontal-scroll-container hide-scrollbar -mx-6 px-6 pb-4">
              {data.scrollableSections.cast.map((member, i) => (
                <div key={i} className="flex flex-col items-center w-[88px] shrink-0 gap-2">
                  <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-[var(--secondary-system-background)] border border-[var(--separator)]">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[24px] text-[var(--tertiary-label)]">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <p className="font-sf-pro text-[12px] font-medium text-[var(--label)] leading-[120%] line-clamp-2 mb-0.5">
                      {member.name}
                    </p>
                    <p className="font-sf-pro text-[11px] text-[var(--secondary-label)] leading-[120%] line-clamp-2">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Extras */}
        {data.scrollableSections.extras && data.scrollableSections.extras.length > 0 && (
          <div className="flex flex-col gap-8 mb-8">
            {data.scrollableSections.extras.map((extra, i) => (
              <div key={i}>
                {extra.title && <h3 className="font-sf-pro text-[20px] font-bold text-[var(--label)] mb-4">{extra.title}</h3>}
                <div className="flex flex-col">
                  {extra.data}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. Related Lists */}
        {data.relatedLists && data.relatedLists.length > 0 && (
          <div className="flex flex-col gap-8 mb-8">
            {data.relatedLists.map((list, i) => (
              <div key={i}>
                <h3 className="font-sf-pro text-[20px] font-bold text-[var(--label)] mb-4">{list.listTitle}</h3>
                <div className="horizontal-scroll-container hide-scrollbar snap-x snap-mandatory -mx-6 px-6 pb-4">
                  {list.items.map((item, index) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      sectionType={item.mediaType}
                      index={index}
                      playingId={playingId}
                      onItemClick={setSelectedItem}
                      onPlayToggle={togglePlay}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <MediaDetailsModal
          item={{
            ...selectedItem,
            type: selectedItem.mediaType
          }}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
