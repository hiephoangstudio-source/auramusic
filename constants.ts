
import { Song, ChartCategory } from './types';

export const MOCK_PLAYLIST: Song[] = [
  {
    id: '1',
    title: 'Hôn Lễ Của Em',
    artist: 'Trọng Nhân, Tiểu Mỹ',
    album: 'VIEENT Music',
    coverUrl: 'https://images.unsplash.com/photo-1511733351957-2cdd946060fd?q=80&w=400&h=400&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 180,
    color: '#991b1b',
  },
  {
    id: '2',
    title: 'Vạn Sự Như Ý',
    artist: 'Trúc Nhân',
    album: 'Universal Music',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&h=400&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 210,
    color: '#1e3a8a',
  },
  {
    id: '3',
    title: 'Ai Ngoài Anh',
    artist: 'VSTRA, Tyronee',
    album: 'The Orchard',
    coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=400&h=400&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 195,
    color: '#166534',
  }
];

export const MOCK_CHARTS: ChartCategory[] = [
  {
    id: 'top-all',
    title: 'Top 50 Bài Hát T...',
    color: 'rgba(153, 27, 27, 0.25)', // Red
    songs: [
      { id: 'chart-1', title: 'Hôn Lễ Của Em', artist: 'Trọng Nhân, Tiểu Mỹ', coverUrl: 'https://picsum.photos/seed/wedding/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 180, color: '#991b1b' },
      { id: 'chart-2', title: 'Vạn Sự Như Ý', artist: 'Trúc Nhân', coverUrl: 'https://picsum.photos/seed/luck/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 210, color: '#1e3a8a' },
      { id: 'chart-3', title: 'Ai Ngoài Anh', artist: 'VSTRA, Tyronee', coverUrl: 'https://picsum.photos/seed/outside/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 195, color: '#166534' },
      { id: 'chart-4', title: 'Dạo Này', artist: 'Obito', coverUrl: 'https://picsum.photos/seed/recently/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 205, color: '#374151' },
      { id: 'chart-5', title: 'Gió Đưa Tình', artist: 'Wren Evans', coverUrl: 'https://picsum.photos/seed/wind/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 190, color: '#1e40af' }
    ]
  },
  {
    id: 'top-vpop',
    title: 'Top 50 Nhạc Việt',
    color: 'rgba(22, 101, 52, 0.25)', // Green
    songs: [
      { id: 'vpop-1', title: '50 Năm Về Sau', artist: 'F47, meChill', coverUrl: 'https://picsum.photos/seed/50years/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: 240, color: '#1e40af' },
      { id: 'vpop-2', title: 'Không Buông', artist: 'Hngle, Ari', coverUrl: 'https://picsum.photos/seed/dontletgo/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', duration: 220, color: '#991b1b' },
      { id: 'vpop-3', title: 'In Love', artist: 'Low G, JustaTee', coverUrl: 'https://picsum.photos/seed/inlove/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', duration: 185, color: '#166534' },
      { id: 'vpop-4', title: 'Tết Ta Về', artist: 'Đông Nhi, Jun Phạm', coverUrl: 'https://picsum.photos/seed/tet/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', duration: 185, color: '#b91c1c' },
      { id: 'vpop-5', title: 'Nhớ Em 8 Lần', artist: 'CONGB', coverUrl: 'https://picsum.photos/seed/missyou/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', duration: 200, color: '#1e40af' }
    ]
  },
  {
    id: 'top-china',
    title: 'Top 50 Nhạc Hoa',
    color: 'rgba(88, 28, 135, 0.25)', // Purple
    songs: [
      { id: 'cpop-1', title: '跳楼机', artist: 'LBI', coverUrl: 'https://picsum.photos/seed/china1/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', duration: 190, color: '#1e3a8a' },
      { id: 'cpop-2', title: '昨夜风今宵月', artist: 'Trang Kỳ Văn', coverUrl: 'https://picsum.photos/seed/china2/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', duration: 200, color: '#3730a3' },
      { id: 'cpop-3', title: 'Váy Cưới Của Em', artist: 'Lý Phát Phát', coverUrl: 'https://picsum.photos/seed/china3/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', duration: 225, color: '#1e3a8a' },
      { id: 'cpop-4', title: 'Nhầm Lẫn Loạn Hoa', artist: 'YN-K', coverUrl: 'https://picsum.photos/seed/china4/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', duration: 180, color: '#581c87' },
      { id: 'cpop-5', title: 'Mạc Vấn Quy Kỳ', artist: 'Thị Thất', coverUrl: 'https://picsum.photos/seed/china5/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', duration: 210, color: '#5b21b6' }
    ]
  }
];

export const APP_NAME = 'AURA';
