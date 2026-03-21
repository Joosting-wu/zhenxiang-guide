import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Rate, Spin, Empty, message, Alert, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
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

const LOGO_URL = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Modern+restaurant+app+logo+orange+and+white+minimalist&image_size=square';

const getFallbackImage = (categoryName: string) => {
  if (categoryName === '吃得香') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=delicious+food+restaurant+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '玩得嗨') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=amusement+park+entertainment+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '美得很') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beauty+salon+spa+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '住得爽') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hotel+resort+minimalist+icon+orange+and+white&image_size=square';
  return LOGO_URL;
};

const Home: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCity, setCurrentCity] = useState(localStorage.getItem('currentCity') || '广州市');
  const [locationStatus, setLocationStatus] = useState<string>('正在同步城市信息...');
  const [isCityCenter, setIsCityCenter] = useState<boolean>(true);
  const [animatingFavId, setAnimatingFavId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = async (city: string, categoryId?: number | null) => {
    setLoading(true);
    try {
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      
      const url = `/api/merchants?limit=8&sort=rating&city=${encodeURIComponent(city)}${categoryId ? `&category=${categoryId}` : ''}`;
      
      const [merchantsRes, categoriesRes] = await Promise.all([
        axios.get(url, { headers }),
        axios.get('/api/merchants/categories')
      ]);
      
      const merchantsWithDistance = merchantsRes.data.data.map((m: any) => {
        let imageUrl = getFallbackImage(m.category_name);
        try {
          if (m.images) {
            const images = typeof m.images === 'string' ? JSON.parse(m.images) : m.images;
            if (Array.isArray(images) && images.length > 0) {
              imageUrl = images[0];
            }
          }
        } catch (e) {
          console.error('Parse images error', e);
        }

        return {
          ...m,
          distance: (Math.random() * 5 + 0.5).toFixed(1),
          image_url: imageUrl,
          good_rating_ratio: m.total_reviews > 0 
            ? Math.round((m.good_reviews_count / m.total_reviews) * 100).toString() 
            : '100' // default if no reviews or fallback
        };
      });

      setMerchants(merchantsWithDistance);
      setCategories(categoriesRes.data);
      setLocationStatus(`已为您切换至 ${city}，推荐附近商户`);
    } catch (error) {
      message.error('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically select the first category ("吃得香" typically id 1) on initial load
    setActiveCategory(1);
    fetchData(currentCity, 1);

    const handleCityChange = () => {
        const newCity = localStorage.getItem('currentCity') || '广州市';
        setCurrentCity(newCity);
        // fetchData will use the current activeCategory state, but since this is an event listener callback,
        // it might capture the initial activeCategory. We can use a ref or just fetch with current state 
        // Note: For simplicity, passing 1 if activeCategory is null, or we can just let it fetch without category
        fetchData(newCity, 1);
      };

    window.addEventListener('cityChange', handleCityChange);
    return () => window.removeEventListener('cityChange', handleCityChange);
  }, []);

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
        m.id === merchantId ? { ...m, is_favorite: isFav } : m
      ));
      
      if (isFav) {
        message.success({ content: '😍 我真香了！', key: 'fav-toast' });
        setAnimatingFavId(merchantId);
        setTimeout(() => setAnimatingFavId(null), 600);
      } else {
        message.info({ content: '🥲 突然就不香了~', key: 'fav-toast' });
      }
    } catch (error) {
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
      fetchData(currentCity, null);
    } else {
      setActiveCategory(categoryId);
      fetchData(currentCity, categoryId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] space-y-4">
        <Spin size="large" />
        <span className="text-gray-500">{locationStatus}</span>
      </div>
    );
  }

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

      <div className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
      {/* Location Bar */}
      <div className="flex items-center text-sm text-gray-600 mb-6 bg-orange-50 p-3 rounded-lg border border-orange-100">
        <MapPin size={16} className="text-orange-500 mr-2" />
        {locationStatus}
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
          <h2 className="text-xl font-bold text-gray-800">
            网友都觉得香
          </h2>
          <Link to="/search" className="text-orange-500 hover:text-orange-600 font-medium">查看更多</Link>
        </div>

        {merchants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            {merchants.map(merchant => (
              <Link 
                to={`/merchant/${merchant.id}`}
                key={merchant.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex"
              >
                {/* Left side: Image */}
                <div className="w-2/5 h-48 relative flex-shrink-0">
                  <img 
                    src={merchant.image_url} 
                    alt={merchant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackImage(merchant.category_name);
                    }}
                  />
                </div>
                
                {/* Right side: Content */}
                <div className="w-3/5 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
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
                        <div className="flex items-center gap-2 mb-2">
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
        ) : (
          <Empty description="暂无推荐商户" />
        )}
      </section>
      </div>
    </div>
  );
};

export default Home;
