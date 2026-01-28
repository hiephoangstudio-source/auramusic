
export type RepeatMode = 'none' | 'all' | 'one';
export type VisualizerType = 'bars' | 'circle' | 'wave';
export type VisualizerTheme = 'default' | 'ocean' | 'fire' | 'neon';
export type VisualEffect = 'none' | 'neon' | 'fluid';
export type ThemeMode = 'light' | 'dark';
export type ViewMode = 'player' | 'explore';

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

export interface ChartCategory {
  id: string;
  title: string;
  color: string;
  songs: Song[];
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
