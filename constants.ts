
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
    color: 'rgba(153, 27, 27, 0.25)', 
    songs: [
      { id: 't1-1', title: 'Hôn Lễ Của Em', artist: 'Trọng Nhân, Tiểu Mỹ', coverUrl: 'https://picsum.photos/seed/wed1/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 180, color: '#991b1b' },
      { id: 't1-2', title: 'Vạn Sự Như Ý', artist: 'Trúc Nhân', coverUrl: 'https://picsum.photos/seed/luck1/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 210, color: '#1e3a8a' },
      { id: 't1-3', title: 'Ai Ngoài Anh', artist: 'VSTRA, Tyronee', coverUrl: 'https://picsum.photos/seed/out1/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 195, color: '#166534' },
      { id: 't1-4', title: 'Dạo Này', artist: 'Obito', coverUrl: 'https://picsum.photos/seed/rec1/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 205, color: '#374151' },
      { id: 't1-5', title: 'Gió Đưa Tình', artist: 'Wren Evans', coverUrl: 'https://picsum.photos/seed/win1/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 190, color: '#1e40af' },
      { id: 't1-6', title: 'Nấu Ăn Cho Em', artist: 'Đen Vâu', coverUrl: 'https://picsum.photos/seed/den/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: 230, color: '#166534' },
      { id: 't1-7', title: 'Vì Anh Đâu Biết', artist: 'Madihu, Vũ.', coverUrl: 'https://picsum.photos/seed/madi/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', duration: 215, color: '#1e3a8a' },
      { id: 't1-8', title: 'Dự Báo Thời Tiết', artist: 'GREY D', coverUrl: 'https://picsum.photos/seed/grey/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: 200, color: '#374151' },
      { id: 't1-9', title: 'Bên Trên Tầng Lầu', artist: 'Tăng Duy Tân', coverUrl: 'https://picsum.photos/seed/tang/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', duration: 180, color: '#991b1b' },
      { id: 't1-10', title: 'Từng Quen', artist: 'Wren Evans', coverUrl: 'https://picsum.photos/seed/wren2/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', duration: 195, color: '#1e40af' }
    ]
  },
  {
    id: 'top-vpop',
    title: 'Top 50 Nhạc Việt',
    color: 'rgba(22, 101, 52, 0.25)', 
    songs: [
      { id: 'v1', title: '50 Năm Về Sau', artist: 'F47, meChill', coverUrl: 'https://picsum.photos/seed/v1/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', duration: 240, color: '#1e40af' },
      { id: 'v2', title: 'Không Buông', artist: 'Hngle, Ari', coverUrl: 'https://picsum.photos/seed/v2/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', duration: 220, color: '#991b1b' },
      { id: 'v3', title: 'In Love', artist: 'Low G, JustaTee', coverUrl: 'https://picsum.photos/seed/v3/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', duration: 185, color: '#166534' },
      { id: 'v4', title: 'Tết Ta Về', artist: 'Đông Nhi, Jun Phạm', coverUrl: 'https://picsum.photos/seed/v4/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', duration: 185, color: '#b91c1c' },
      { id: 'v5', title: 'Nhớ Em 8 Lần', artist: 'CONGB', coverUrl: 'https://picsum.photos/seed/v5/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', duration: 200, color: '#1e40af' },
      { id: 'v6', title: 'Mật Ngọt', artist: 'Dunghoangpham', coverUrl: 'https://picsum.photos/seed/v6/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', duration: 210, color: '#166534' },
      { id: 'v7', title: 'Lệ Lưu Ly', artist: 'Vũ Phụng Tiên', coverUrl: 'https://picsum.photos/seed/v7/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 190, color: '#1e3a8a' },
      { id: 'v8', title: 'Ngày Mai Người Ta Lấy Chồng', artist: 'Thành Đạt', coverUrl: 'https://picsum.photos/seed/v8/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 245, color: '#991b1b' },
      { id: 'v9', title: 'Thị Mầu', artist: 'Hòa Minzy', coverUrl: 'https://picsum.photos/seed/v9/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 200, color: '#b91c1c' },
      { id: 'v10', title: 'Bật Tình Yêu Lên', artist: 'Tăng Duy Tân, Hòa Minzy', coverUrl: 'https://picsum.photos/seed/v10/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 180, color: '#166534' }
    ]
  },
  {
    id: 'top-china',
    title: 'Top 50 Nhạc Hoa',
    color: 'rgba(88, 28, 135, 0.25)', 
    songs: [
      { id: 'c1', title: '跳楼机', artist: 'LBI', coverUrl: 'https://picsum.photos/seed/c1/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 190, color: '#1e3a8a' },
      { id: 'c2', title: '昨夜风今宵月', artist: 'Trang Kỳ Văn', coverUrl: 'https://picsum.photos/seed/c2/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: 200, color: '#3730a3' },
      { id: 'c3', title: 'Váy Cưới Của Em', artist: 'Lý Phát Phát', coverUrl: 'https://picsum.photos/seed/c3/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', duration: 225, color: '#1e3a8a' },
      { id: 'c4', title: 'Nhầm Lẫn Loạn Hoa', artist: 'YN-K', coverUrl: 'https://picsum.photos/seed/c4/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: 180, color: '#581c87' },
      { id: 'c5', title: 'Mạc Vấn Quy Kỳ', artist: 'Thị Thất', coverUrl: 'https://picsum.photos/seed/c5/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', duration: 210, color: '#5b21b6' },
      { id: 'c6', title: 'Thanh Ty', artist: 'Đẳng Thập Ma Quân', coverUrl: 'https://picsum.photos/seed/c6/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', duration: 230, color: '#3730a3' },
      { id: 'c7', title: 'Xích Linh', artist: 'HITA', coverUrl: 'https://picsum.photos/seed/c7/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', duration: 240, color: '#581c87' },
      { id: 'c8', title: 'Mang Chủng', artist: 'Âm Khuyết Thi Thính', coverUrl: 'https://picsum.photos/seed/c8/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', duration: 210, color: '#5b21b6' },
      { id: 'c9', title: 'Yến Vô Hiết', artist: 'Là Thất Thất', coverUrl: 'https://picsum.photos/seed/c9/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', duration: 195, color: '#1e3a8a' },
      { id: 'c10', title: 'Phi Điểu Và Ve Sầu', artist: 'Nhậm Nhiên', coverUrl: 'https://picsum.photos/seed/c10/200/200', album: 'Lossless', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', duration: 200, color: '#3730a3' }
    ]
  }
];

export const APP_NAME = 'AURA';
