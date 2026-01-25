
import { Song } from './types';

export const MOCK_PLAYLIST: Song[] = [
  {
    id: '1',
    title: 'Cyber Drift',
    artist: 'Neon Architect',
    album: 'Future City',
    coverUrl: 'https://picsum.photos/id/123/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372,
    color: '#6366f1',
    lyrics: [
      { time: 0, text: "Wait for the neon lights" },
      { time: 5, text: "Streaming through the digital night" },
      { time: 10, text: "Circuit boards and heavy bass" },
      { time: 15, text: "Vanishing in binary space" },
      { time: 20, text: "The architectural glow..." },
      { time: 25, text: "Is all we ever need to know" }
    ]
  },
  {
    id: '2',
    title: 'Stellar Pulse',
    artist: 'Galactic Voyager',
    album: 'Deep Space',
    coverUrl: 'https://picsum.photos/id/234/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 425,
    color: '#a855f7',
    lyrics: [
      { time: 0, text: "Floating in the silence" },
      { time: 4, text: "Between the stars so cold" },
      { time: 8, text: "A pulsing rhythm calls me" },
      { time: 12, text: "To secrets yet untold" }
    ]
  },
  {
    id: '3',
    title: 'Midnight Rain',
    artist: 'Lofi Soul',
    album: 'Cloud Nine',
    coverUrl: 'https://picsum.photos/id/345/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 312,
    color: '#ec4899',
    lyrics: [
      { time: 0, text: "Coffee's getting cold now" },
      { time: 5, text: "Watching rain against the glass" },
      { time: 10, text: "Memories like shadows" },
      { time: 15, text: "As the minutes slowly pass" }
    ]
  },
  {
    id: '4',
    title: 'Digital Horizon',
    artist: 'Bit Master',
    album: 'Data Stream',
    coverUrl: 'https://picsum.photos/id/456/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 388,
    color: '#06b6d4'
  }
];

export const APP_NAME = 'AURA';
