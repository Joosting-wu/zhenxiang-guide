import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Rate, Spin, message, Tag, Button } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MapPin } from 'lucide-react';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

interface Merchant {
  id: number;
  name: string;
  description: string;
  image_url: string;
  images?: string | string[];
  avg_rating: number;
  review_count: number;
  good_rating_ratio?: string; // Add good rating ratio
  category_name: string;
  area?: string;
  distance?: string;
  is_auto_filled?: boolean;
  status: string;
  is_favorite?: boolean;
  owner_id: number;
  total_favorites?: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

// 后端 /api/merchants 返回的原始行结构（仅声明首页会用到的字段）
interface RawMerchantRow {
  id: number;
  name: string;
  description?: string | null;
  category_name: string;
  images?: string | string[] | null;
  avg_rating?: number | null;
  review_count?: number | null;
  total_reviews?: number | null;
  good_reviews_count?: number | null;
  status?: string | null;
  owner_id?: number | null;
  total_favorites?: number | null;
  is_favorite?: boolean | number | null;
  is_auto_filled?: boolean | null;
}

const LOGO_URL = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Modern+restaurant+app+logo+orange+and+white+minimalist&image_size=square';

const getFallbackImage = (categoryName: string) => {
  if (categoryName === '吃得香') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=delicious+food+restaurant+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '玩得嗨') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=amusement+park+entertainment+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '美得很') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beauty+salon+spa+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '住得爽') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hotel+resort+minimalist+icon+orange+and+white&image_size=square';
  return LOGO_URL;
};

const buildCoverImage = (prompt: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`;

// 默认城市（定位失败或未授权时使用）
const FALLBACK_CITY = '广州市';

// 首页内置 fallback 分类，保证分类区在接口异常时依然完整可点
const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: '吃得香', icon: '🍽️' },
  { id: 2, name: '玩得嗨', icon: '🎬' },
  { id: 3, name: '美得很', icon: '🛍️' },
  { id: 4, name: '住得爽', icon: '🏨' },
];

// 首页内置 fallback 商户数据（默认城市：广州），字段包含：名称 / 分类 / 评分 / 简短卖点 / 封面图 / 区域
interface FallbackMerchant {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  avg_rating: number;
  review_count: number;
  description: string;
  image_url: string;
  area: string;
  total_favorites: number;
  status: string;
  owner_id: number;
}

const FALLBACK_MERCHANTS: FallbackMerchant[] = [
  {
    id: 900001,
    name: '广州酒家（文昌总店）',
    category_id: 1,
    category_name: '吃得香',
    avg_rating: 4.7,
    review_count: 1286,
    description: '百年粤菜老字号，虾饺皮薄馅足，早茶建议早点去',
    image_url: buildCoverImage('traditional cantonese restaurant dim sum table, warm light, realistic food photo'),
    area: '荔湾区',
    total_favorites: 326,
    status: '营业',
    owner_id: 0,
  },
  {
    id: 900002,
    name: '点都德（北京路店）',
    category_id: 1,
    category_name: '吃得香',
    avg_rating: 4.5,
    review_count: 964,
    description: '广式点心人气王，红米肠、流沙包基本每桌必点',
    image_url: buildCoverImage('cantonese dim sum steamer baskets, shrimp rice roll, realistic food photo'),
    area: '越秀区',
    total_favorites: 214,
    status: '营业',
    owner_id: 0,
  },
  {
    id: 900003,
    name: '广州塔（小蛮腰）',
    category_id: 2,
    category_name: '玩得嗨',
    avg_rating: 4.6,
    review_count: 2048,
    description: '城市地标登高看夜景，摩天轮打卡出片率超高',
    image_url: buildCoverImage('canton tower guangzhou at night, city skyline, realistic photo'),
    area: '海珠区',
    total_favorites: 892,
    status: '营业',
    owner_id: 0,
  },
  {
    id: 900004,
    name: '长隆欢乐世界',
    category_id: 2,
    category_name: '玩得嗨',
    avg_rating: 4.5,
    review_count: 1530,
    description: '华南顶级主题乐园，过山车刺激又解压，适合一整天',
    image_url: buildCoverImage('amusement park roller coaster, sunny day, realistic photo'),
    area: '番禺区',
    total_favorites: 561,
    status: '营业',
    owner_id: 0,
  },
  {
    id: 900005,
    name: '悦己SPA（天河店）',
    category_id: 3,
    category_name: '美得很',
    avg_rating: 4.4,
    review_count: 682,
    description: '环境安静，技师手法专业，是放松解压的首选',
    image_url: buildCoverImage('serene spa massage room, candles, relaxing atmosphere, realistic photo'),
    area: '天河区',
    total_favorites: 148,
    status: '营业',
    owner_id: 0,
  },
  {
    id: 900006,
    name: '花园酒店',
    category_id: 4,
    category_name: '住得爽',
    avg_rating: 4.6,
    review_count: 640,
    description: '老牌五星酒店，位置核心，景观房体验稳定',
    image_url: buildCoverImage('luxury hotel exterior with garden, guangzhou, realistic photo'),
    area: '越秀区',
    total_favorites: 243,
    status: '营业',
    owner_id: 0,
  },
];

// 将 fallback 原始数据映射为页面渲染所需的 Merchant 结构
const buildFallback = (): Merchant[] =>
  FALLBACK_MERCHANTS.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    image_url: m.image_url,
    avg_rating: m.avg_rating,
    review_count: m.review_count,
    good_rating_ratio: '100',
    category_name: m.category_name,
    area: m.area,
    status: m.status,
    owner_id: m.owner_id,
    total_favorites: m.total_favorites,
    is_favorite: false,
    is_auto_filled: false,
  }));

// 支持的城市中心点（用于把定位坐标就近映射到城市）
const SUPPORTED_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: '广州市', lat: 23.1291, lng: 113.2644 },
  { name: '深圳市', lat: 22.5431, lng: 114.0579 },
  { name: '北京市', lat: 39.9042, lng: 116.4074 },
  { name: '上海市', lat: 31.2304, lng: 121.4737 },
  { name: '杭州市', lat: 30.2741, lng: 120.1551 },
];

const resolveCityFromCoords = (lat: number, lng: number): string | null => {
  let best: { name: string; dist: number } | null = null;
  for (const c of SUPPORTED_CITIES) {
    const d = Math.hypot(lat - c.lat, lng - c.lng);
    if (!best || d < best.dist) best = { name: c.name, dist: d };
  }
  // 距离容差：超过约 5 度认为不在支持范围内，返回 null 走默认城市
  return best && best.dist <= 5 ? best.name : null;
};

// 后台异步定位：永不 reject、永不阻塞首屏；被拒绝 / 超时 / 不支持一律返回 null
const getGeolocationCity = (): Promise<string | null> =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => done(null), 5000);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          done(resolveCityFromCoords(pos.coords.latitude, pos.coords.longitude));
        },
        () => {
          clearTimeout(timer);
          done(null);
        },
        { enableHighAccuracy: false, timeout: 4500, maximumAge: 300000 }
      );
    } catch {
      clearTimeout(timer);
      done(null);
    }
  });

const Home: React.FC = () => {
  // 首屏直接以 fallback 数据渲染，保证不会白屏
  const [merchants, setMerchants] = useState<Merchant[]>(() => buildFallback());
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [currentCity, setCurrentCity] = useState(localStorage.getItem('currentCity') || FALLBACK_CITY);
  const [locationStatus, setLocationStatus] = useState<string>('正在为你挑选热门商户…');
  const [isFallback, setIsFallback] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [animatingFavId, setAnimatingFavId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(1);
  const [ratingRowWidth, setRatingRowWidth] = useState<number | null>(null);
  const [ratingRowWidthBaseline, setRatingRowWidthBaseline] = useState<number | null>(null);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 请求序号：只接受最新一次请求的结果，避免慢请求覆盖新数据
  const requestIdRef = useRef(0);
  const isFirstLocationRunRef = useRef(true);

  const searchParams = new URLSearchParams(location.search);
  const layoutMode = (searchParams.get('layout') || 'new').toLowerCase();
  const debugWidth = searchParams.get('debugWidth') === '1';

  const fetchData = useCallback(async (
    city: string,
    categoryId?: number | null,
    opts: { initial?: boolean } = {}
  ) => {
    const reqId = ++requestIdRef.current;
    setIsRefreshing(true);

    let rawData: RawMerchantRow[] = [];
    try {
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const url = `/api/merchants?limit=8&sort=rating&city=${encodeURIComponent(city)}${categoryId ? `&category=${categoryId}` : ''}`;
      const merchantsRes = await axios.get(url, { headers, timeout: 8000 });
      rawData = Array.isArray(merchantsRes.data?.data) ? merchantsRes.data.data : [];
    } catch {
      // 接口报错 / 超时：保持 fallback，不抛出、不阻塞
      rawData = [];
    }

    // 分类单独请求，失败不影响商户展示（保留 fallback 分类）
    try {
      const categoriesRes = await axios.get('/api/merchants/categories', { timeout: 8000 });
      if (reqId === requestIdRef.current && Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0) {
        setCategories(categoriesRes.data);
      }
    } catch {
      // 保持 FALLBACK_CATEGORIES
    }

    if (reqId !== requestIdRef.current) return;

    if (rawData.length > 0) {
      const merchantsWithMeta: Merchant[] = rawData.map((m) => {
        let imageUrl = getFallbackImage(m.category_name);
        try {
          if (m.images) {
            const images = typeof m.images === 'string' ? JSON.parse(m.images) : m.images;
            if (Array.isArray(images) && images.length > 0) {
              imageUrl = String(images[0]);
            }
          }
        } catch (e) {
          console.error('Parse images error', e);
        }

        const totalReviews = Number(m.total_reviews ?? 0);
        const goodReviews = Number(m.good_reviews_count ?? 0);

        return {
          id: Number(m.id),
          name: m.name,
          description: m.description ?? '',
          image_url: imageUrl,
          images: m.images ?? undefined,
          avg_rating: Number(m.avg_rating ?? 0),
          review_count: Number(m.review_count ?? 0),
          good_rating_ratio: totalReviews > 0
            ? Math.round((goodReviews / totalReviews) * 100).toString()
            : '100',
          category_name: m.category_name,
          distance: (Math.random() * 5 + 0.5).toFixed(1),
          is_auto_filled: Boolean(m.is_auto_filled),
          status: m.status ?? '营业',
          is_favorite: Boolean(m.is_favorite),
          owner_id: Number(m.owner_id ?? 0),
          total_favorites: Number(m.total_favorites ?? 0),
        };
      });

      setMerchants(merchantsWithMeta);
      setIsFallback(false);
      if (opts.initial) setLocationStatus(`已为你推荐 ${city} 的热门商户`);
    } else {
      // 返回空数组也保留 fallback，绝不出现空白推荐区
      // 兜底卡片固定为广州数据，故文案不带城市名，避免出现"北京 + 广州店"的错位
      setMerchants(buildFallback());
      setIsFallback(true);
      if (opts.initial) setLocationStatus('为你推荐热门精选');
    }

    setIsRefreshing(false);
  }, [user?.token]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const storedCity = localStorage.getItem('currentCity') || FALLBACK_CITY;
      let city = storedCity;

      // 每次会话只后台定位一次，避免返回首页时反复定位
      const alreadyAttempted = sessionStorage.getItem('geoAttempted') === '1';
      if (!alreadyAttempted) {
        sessionStorage.setItem('geoAttempted', '1');
        const geoCity = await getGeolocationCity();
        if (cancelled) return;
        if (geoCity) {
          city = geoCity;
          if (geoCity !== storedCity) {
            localStorage.setItem('currentCity', geoCity);
            // 通知导航栏同步城市显示（Home 自身监听的是 cityChange，不会重复拉取）
            window.dispatchEvent(new Event('cityLocationResolved'));
          }
        }
      }

      if (cancelled) return;
      setCurrentCity(city);
      await fetchData(city, activeCategory, { initial: true });
    };

    bootstrap();

    const handleCityChange = () => {
      const newCity = localStorage.getItem('currentCity') || FALLBACK_CITY;
      setCurrentCity(newCity);
      fetchData(newCity, 1, { initial: false });
    };

    window.addEventListener('cityChange', handleCityChange);
    return () => {
      cancelled = true;
      window.removeEventListener('cityChange', handleCityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  useEffect(() => {
    if (!debugWidth) return;

    const update = () => {
      const el = document.querySelector('[data-rating-row]') as HTMLElement | null;
      const width = el ? el.getBoundingClientRect().width : null;
      setRatingRowWidth(width);

      if (width && layoutMode === 'old') {
        sessionStorage.setItem('ratingRowWidthBaseline', String(width));
      }

      const baseline = Number(sessionStorage.getItem('ratingRowWidthBaseline') || '0');
      setRatingRowWidthBaseline(baseline > 0 ? baseline : null);

      const root = document.documentElement;
      setHasHorizontalScroll(root.scrollWidth > root.clientWidth);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [debugWidth, merchants.length, layoutMode]);

  // Refresh data when returning from other pages (like merchant detail or profile)
  useEffect(() => {
    // 首次挂载由 bootstrap 负责拉取，这里只处理“同页返回”等场景，避免重复请求
    if (isFirstLocationRunRef.current) {
      isFirstLocationRunRef.current = false;
      return;
    }
    fetchData(currentCity, activeCategory, { initial: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const handleToggleFavorite = async (e: React.MouseEvent, merchantId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      message.warning('请先登录后再收藏');
      navigate('/login');
      return;
    }
    try {
      const response = await axios.post(`/api/merchants/${merchantId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const isFav = response.data.is_favorite;
      setMerchants(prev => prev.map(m => 
        m.id === merchantId ? { 
          ...m, 
          is_favorite: isFav,
          total_favorites: isFav ? (m.total_favorites || 0) + 1 : Math.max(0, (m.total_favorites || 0) - 1)
        } : m
      ));

      window.dispatchEvent(new CustomEvent('favoriteChanged', {
        detail: { merchantId, isFavorite: isFav }
      }))
      
      if (isFav) {
        message.success({ content: '😍 我真香了！', key: 'fav-toast' });
        setAnimatingFavId(merchantId);
        setTimeout(() => setAnimatingFavId(null), 600);
      } else {
        message.info({ content: '🥲 突然就不香了~', key: 'fav-toast' });
      }
    } catch {
      message.error('操作失败');
    }
  };

  const getRatingText = (val: number) => {
    if (val === 0) return '';
    if (val <= 2) return '是真不香';
    if (val > 2 && val <= 3.5) return '还蛮香的';
    if (val > 3.5 && val < 4.5) return '确实香';
    return '太香了！';
  };

  const handleCategoryClick = (categoryId: number | null) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null);
      fetchData(currentCity, null, { initial: false });
    } else {
      setActiveCategory(categoryId);
      fetchData(currentCity, categoryId, { initial: false });
    }
  };

  return (
    <div className="flex-grow flex flex-col w-full">
      {/* Hero Section */}
      <div className="relative w-full h-[100px] md:h-[130px] lg:h-[160px] bg-orange-100 overflow-hidden flex-shrink-0">
        <img 
          src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=authentic+candid+photo+of+happy+friends+sharing+a+meal+together+warm+golden+hour+lighting+shot+on+35mm+lens+realistic+details&image_size=landscape_16_9"
          alt="真香指南头图"
          loading="lazy"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/60 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-center text-white px-8 md:px-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 tracking-wider drop-shadow-md" style={{ fontFamily: 'var(--brand-font, sans-serif)' }}>真香指南</h1>
          <p className="text-sm md:text-base lg:text-lg font-medium opacity-90 drop-shadow max-w-2xl">发现城市里的真香现场，寻找属于你的那份“真香”体验</p>
        </div>
      </div>

    <div className="max-w-[100rem] mx-auto px-2 py-8 flex-grow w-full overflow-x-hidden">
      {debugWidth && (
        <div className="mb-4 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>layout={layoutMode}</span>
          <span>ratingDivWidth={ratingRowWidth ? `${Math.round(ratingRowWidth)}px` : '--'}</span>
          <span>baseline={ratingRowWidthBaseline ? `${Math.round(ratingRowWidthBaseline)}px` : '--'}</span>
          <span>ratio={ratingRowWidth && ratingRowWidthBaseline ? `${(ratingRowWidth / ratingRowWidthBaseline).toFixed(2)}x` : '--'}</span>
          <span>horizontalScroll={hasHorizontalScroll ? 'yes' : 'no'}</span>
          <span className="text-gray-400">用 ?layout=old 或 ?layout=new 切换；用 ?debugWidth=1 显示测量</span>
        </div>
      )}
      {/* Location Bar（轻量、不阻塞） */}
      <div className="flex items-center text-sm text-gray-600 mb-6 bg-orange-50 p-3 rounded-lg border border-orange-100">
        <MapPin size={16} className="text-orange-500 mr-2" />
        <span>{locationStatus}</span>
        {isRefreshing && <Spin size="small" className="ml-3" />}
      </div>

      {/* Categories section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 text-gray-800">发现真香现场</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div 
            className={`flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group ${activeCategory === null ? 'ring-2 ring-orange-500' : ''}`}
            onClick={() => typeof handleCategoryClick !== 'undefined' ? handleCategoryClick(null) : null}
          >
            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🌟</span>
            <span className={`font-medium ${activeCategory === null ? 'text-orange-500' : 'text-gray-700'}`}>全部分类</span>
          </div>
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group ${typeof activeCategory !== 'undefined' && activeCategory === cat.id ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => typeof handleCategoryClick !== 'undefined' ? handleCategoryClick(cat.id) : null}
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {cat.name === '吃得香' ? '🍜' : 
                 cat.name === '玩得嗨' ? '🎡' : 
                 cat.name === '美得很' ? '💇‍♀️' : '🏨'}
              </span>
              <span className={`font-medium ${typeof activeCategory !== 'undefined' && activeCategory === cat.id ? 'text-orange-500' : 'text-gray-700'}`}>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Merchants */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">
              网友都觉得香
            </h2>
            {isFallback && (
              <Tag color="orange" className="m-0">热门精选</Tag>
            )}
          </div>
          <Link to="/search" className="text-orange-500 hover:text-orange-600 font-medium">查看更多</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 mb-8">
          {merchants.map(merchant => (
            <Link 
              to={`/merchant/${merchant.id}`}
              key={merchant.id} 
              className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer ${layoutMode === 'old' ? 'flex' : 'flex flex-col sm:flex-row'}`}
            >
              {/* Left side: Image */}
              <div className={`${layoutMode === 'old' ? 'w-2/5' : 'w-full sm:w-2/5'} h-48 relative flex-shrink-0`}>
                <img 
                  src={merchant.image_url} 
                  alt={merchant.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackImage(merchant.category_name);
                  }}
                />
              </div>
              
              {/* Right side: Content */}
              <div className={`${layoutMode === 'old' ? 'w-3/5' : 'w-full sm:w-3/5'} p-4 flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-between items-start">
                    <div className={layoutMode === 'old' ? '' : 'flex-1 min-w-0'}>
                      <h3 className="text-lg font-bold text-gray-800 mb-1 truncate pr-2">
                        {merchant.name}
                        {user?.role === 'merchant' && user?.userId === merchant.owner_id && (
                          <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-xs inline-block border border-blue-100 font-normal align-middle ml-2">我的店铺</span>
                        )}
                      </h3>
                      <div className="flex gap-2 mb-2">
                        <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded text-xs inline-block">
                          {merchant.category_name}
                        </span>
                        {merchant.status && (
                          <span className={`px-2 py-0.5 rounded text-xs inline-block text-white ${merchant.status === '营业' || merchant.status === '营业中' ? 'bg-orange-500' : merchant.status === '休息' || merchant.status === '休息中' ? 'bg-[#fdba74]' : 'bg-[#6b7280]'}`}>
                            {merchant.status === '营业中' ? '营业' : merchant.status === '休息中' ? '休息' : merchant.status}
                          </span>
                        )}
                      </div>
                      <div className={`flex flex-nowrap items-center gap-2 mb-2 whitespace-nowrap ${layoutMode === 'old' ? '' : 'w-full'}`} data-rating-row>
                        <Rate disabled value={Number(merchant.avg_rating)} allowHalf className="text-sm text-orange-400" />
                        <span className="text-gray-500 text-sm font-medium">{Number(merchant.avg_rating).toFixed(1)}分</span>
                        <span className="text-orange-500 font-bold text-xs ml-1">
                          {getRatingText(Number(merchant.avg_rating))}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Button 
                        type="text" 
                        icon={
                          <HeartFilled 
                            className={`text-red-500 transition-all duration-300 ${merchant.is_favorite ? 'opacity-100' : 'opacity-0 absolute'} ${animatingFavId === merchant.id ? 'animate-zhenxiang text-2xl' : 'text-2xl'}`} 
                          />
                        } 
                        onClick={(e) => handleToggleFavorite(e, merchant.id)}
                        className="p-0 h-auto hover:bg-transparent relative"
                      >
                        {!merchant.is_favorite && <HeartOutlined className="text-gray-400 text-2xl hover:text-red-500 transition-colors" />}
                      </Button>
                      <span className="text-red-400 text-[10px] bg-red-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {merchant.total_favorites > 9999 ? '10w+' : (merchant.total_favorites || 0)}人的真香预警
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-0 line-clamp-2 mt-1">{merchant.description}</p>
                </div>

                <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">
                        <span className="text-orange-500 font-bold">{merchant.review_count}</span>个真香现场
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {merchant.area && <span className="text-gray-400 text-xs flex-shrink-0">{merchant.area}</span>}
                      {merchant.distance && <span className="text-gray-400 text-xs flex-shrink-0">距离真香现场{merchant.distance}km</span>}
                      {merchant.is_auto_filled && (
                        <span className="text-orange-400 text-[10px] bg-orange-50 px-1.5 py-0.5 rounded">猜你喜欢</span>
                      )}
                    </div>
                  </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
};

export default Home;
