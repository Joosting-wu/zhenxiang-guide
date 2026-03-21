import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Rate, Spin, Empty, Select, message, Tag, Button } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

interface Merchant {
    id: number;
    name: string;
    description: string;
    image_url: string;
    avg_rating: number;
    review_count: number;
    category_name: string;
    category_id: number;
    images?: string | string[];
    owner_id: number;
    status?: string;
    is_favorite?: boolean;
    total_favorites?: number;
  }

interface Category {
  id: number;
  name: string;
}

const LOGO_URL = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Modern+restaurant+app+logo+orange+and+white+minimalist&image_size=square';

const getFallbackImage = (categoryName: string) => {
  if (categoryName === '吃得香') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=delicious+food+restaurant+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '玩得嗨') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=amusement+park+entertainment+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '美得很') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beauty+salon+spa+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '住得爽') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hotel+resort+minimalist+icon+orange+and+white&image_size=square';
  return LOGO_URL;
};

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return '太香了！';
    if (rating >= 3.5) return '确实香';
    if (rating >= 2.5) return '还蛮香的';
    if (rating > 0) return '是真不香';
    return '';
  };
  const [currentCity, setCurrentCity] = useState(localStorage.getItem('currentCity') || '广州市');
  const [animatingFavId, setAnimatingFavId] = useState<number | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const keyword = searchParams.get('keyword') || '';
  const categoryId = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    const handleCityChange = () => {
      setCurrentCity(localStorage.getItem('currentCity') || '广州市');
    };
    window.addEventListener('cityChange', handleCityChange);
    return () => window.removeEventListener('cityChange', handleCityChange);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/merchants/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      try {
        const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
        const response = await axios.get('/api/merchants', {
          headers,
          params: {
            keyword,
            category: categoryId,
            sort: sort === 'rating' ? 'rating' : 'newest',
            city: currentCity,
            limit: 100 // Request a large enough limit to show all merchants
          }
        });
        
        const merchantsWithImages = response.data.data.map((m: Merchant) => {
          let imageUrl = getFallbackImage(m.category_name);
          try {
            if (m.images) {
              const images = typeof m.images === 'string' ? JSON.parse(m.images) : m.images;
              if (Array.isArray(images) && images.length > 0) {
                imageUrl = images[0];
              }
            }
          } catch (e) {}
          return { ...m, image_url: imageUrl };
        });

        setMerchants(merchantsWithImages);
      } catch (error) {
        message.error('搜索失败');
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, [keyword, categoryId, sort, currentCity]);

  const handleCategoryChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set('category', value);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    setSearchParams(newParams);
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium">分类：</span>
            <Select
              defaultValue={categoryId}
              className="w-40"
              onChange={handleCategoryChange}
              options={[
                { value: '', label: '全部分类' },
                ...categories.map(c => ({ value: String(c.id), label: c.name }))
              ]}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium">排序：</span>
            <Select
              defaultValue={sort}
              className="w-40"
              onChange={handleSortChange}
              options={[
                { value: 'newest', label: '最新发布' },
                { value: 'rating', label: '评分最高' },
              ]}
            />
          </div>
          {(keyword || categoryId) && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-400 text-sm">正在筛选：</span>
              {keyword && <Tag color="orange" closable onClose={() => {
                const p = new URLSearchParams(searchParams);
                p.delete('keyword');
                setSearchParams(p);
              }}>{keyword}</Tag>}
              {categoryId && <Tag color="orange" closable onClose={() => handleCategoryChange('')}>
                {categories.find(c => String(c.id) === categoryId)?.name}
              </Tag>}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Spin size="large" /></div>
      ) : merchants.length > 0 ? (
        <Row gutter={[24, 24]}>
          {merchants.map((merchant) => (
            <Col key={merchant.id} xs={24} sm={12} md={8} lg={6}>
              <Link to={`/merchant/${merchant.id}`}>
                <Card
                  hoverable
                  cover={
                    <div className="h-48 overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                      <img 
                        alt={merchant.name} 
                        src={merchant.image_url || getFallbackImage(merchant.category_name)} 
                        className="w-full h-auto max-h-[160px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackImage(merchant.category_name);
                        }}
                      />
                    </div>
                  }
                  className="h-full border-none shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden"
                  bodyStyle={{ padding: '16px' }}
                >
                  <div className="mb-2 flex gap-2">
                    <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded">
                      {merchant.category_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-gray-800 truncate pr-2">
                      {merchant.name}
                      {user?.role === 'merchant' && user?.userId === merchant.owner_id && (
                        <span className="text-xs font-normal text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 align-middle ml-2">
                          我的店铺
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Button 
                        type="text" 
                        icon={
                          <HeartFilled 
                            className={`text-red-500 transition-all duration-300 ${merchant.is_favorite ? 'opacity-100' : 'opacity-0 absolute'} ${animatingFavId === merchant.id ? 'animate-zhenxiang text-2xl' : 'text-2xl'}`} 
                          />
                        } 
                        onClick={(e) => handleToggleFavorite(e, merchant.id)}
                        className="p-0 h-auto hover:bg-transparent relative z-10"
                      >
                        {!merchant.is_favorite && <HeartOutlined className="text-gray-400 text-2xl hover:text-red-500 transition-colors" />}
                      </Button>
                      <span className="text-red-400 text-[10px] bg-red-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {(merchant.total_favorites || 0) > 9999 ? '10w+' : (merchant.total_favorites || 0)}人的真香预警
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Rate disabled defaultValue={Number(merchant.avg_rating)} allowHalf className="text-orange-400 text-sm" />
                    <span className="text-gray-500 text-sm">
                      <span className="text-orange-500 font-medium">{Number(merchant.avg_rating).toFixed(1)}</span>分
                      {merchant.avg_rating > 0 && <span className="text-xs ml-1 text-orange-400">{getRatingText(merchant.avg_rating)}</span>}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-0 line-clamp-2">{merchant.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-gray-400 text-xs">
                    <span>
                      <span className="text-orange-500 font-bold">{merchant.review_count}</span>个真香现场
                    </span>
                    {merchant.status && (
                      <span className={`px-2 py-0.5 rounded text-xs inline-block text-white ${merchant.status === '营业' || merchant.status === '营业中' ? 'bg-orange-500' : merchant.status === '休息' || merchant.status === '休息中' ? 'bg-[#fdba74]' : 'bg-[#6b7280]'}`}>
                        {merchant.status === '营业中' ? '营业' : merchant.status === '休息中' ? '休息' : merchant.status}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="未找到符合条件的商户" className="py-20 bg-white rounded-2xl" />
      )}
    </div>
  );
};

export default Search;
