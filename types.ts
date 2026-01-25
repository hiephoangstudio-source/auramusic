
export type RepeatMode = 'none' | 'all' | 'one';
export type VisualizerType = 'bars' | 'circle' | 'wave';
export type VisualizerTheme = 'default' | 'ocean' | 'fire' | 'neon';
export type VisualEffect = 'none' | 'neon' | 'fluid';
export type ThemeMode = 'light' | 'dark';
export type ViewMode = 'player' | 'list';

export interface LyricLine {
  time: number;
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  color: string;
  lyrics?: LyricLine[];
  rating?: number;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
}

export interface Recommendation {
  vibe: string;
  description: string;
  suggestedArtist: string;
  suggestedGenre: string;
  suggestedPlaylist?: { title: string; artist: string; type?: string }[];
  remixSuggestions?: { title: string; version: string }[];
}

export interface DJSession {
  id: string;
  name: string;
  type: 'standard' | 'radio';
  timestamp: number;
  recommendation: Recommendation;
}

export interface PlayerState {
  isPlaying: boolean;
  currentSongIndex: number;
  currentTime: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  visualizerType: VisualizerType;
  visualizerTheme: VisualizerTheme;
  visualEffect: VisualEffect;
  theme: ThemeMode;
  accentColor: string;
  playbackSpeed: number;
  viewMode: ViewMode;
  sleepTimerMinutes: number | null;
}
