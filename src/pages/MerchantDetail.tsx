import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Rate, Button, Card, Avatar, List, Form, Input, message, Spin, Divider, Space } from 'antd';
import { UserOutlined, EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, EditOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface Merchant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  business_hours: string;
  images: string | string[]; // Changed from image_url
  avg_rating: number;
  review_count: number;
  category_name: string;
  category_id: number;
  owner_id: number;
  status: string;
  is_favorite?: boolean;
}

interface Review {
  id: number;
  user_id: number;
  user_name: string;
  avatar_url: string;
  rating: number;
  content: string;
  images: string[];
  reply_content?: string;
  replied_at?: string;
  created_at: string;
}

interface MerchantDetailData {
  merchant: Merchant;
  recentComments: Review[];
  needLogin: boolean;
  hasCommented: boolean;
}

const LOGO_URL = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Modern+restaurant+app+logo+orange+and+white+minimalist&image_size=square';

const getFallbackImage = (categoryName?: string) => {
  if (categoryName === '吃得香') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=delicious+food+restaurant+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '玩得嗨') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=amusement+park+entertainment+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '美得很') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beauty+salon+spa+minimalist+icon+orange+and+white&image_size=square';
  if (categoryName === '住得爽') return 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hotel+resort+minimalist+icon+orange+and+white&image_size=square';
  return LOGO_URL;
};

const MerchantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MerchantDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [animatingFav, setAnimatingFav] = useState(false);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const getRatingText = (val: number) => {
    if (val === 0) return '';
    if (val <= 2) return '是真不香';
    if (val > 2 && val <= 3.5) return '还蛮香的';
    if (val > 3.5 && val < 4.5) return '确实香';
    return '太香了！';
  };

  const currentRatingValue = hoverRating > 0 ? hoverRating : selectedRating;

  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [replyForm] = Form.useForm();

  const fetchData = async () => {
    try {
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      
      const response = await axios.get(`/api/merchants/${id}`, { headers });
      
      const resData = response.data;
      
      // The images might be a JSON string from DB, or already parsed
      if (resData.merchant) {
        if (typeof resData.merchant.images === 'string') {
          try {
            const parsed = JSON.parse(resData.merchant.images);
            resData.merchant.images = Array.isArray(parsed) ? parsed : [resData.merchant.images];
          } catch (e) {
            // If it's not valid JSON, it might just be a raw URL string
            if (resData.merchant.images.trim() !== '') {
              resData.merchant.images = [resData.merchant.images];
            } else {
              resData.merchant.images = [];
            }
          }
        } else if (!Array.isArray(resData.merchant.images)) {
          // If it's neither string nor array, make it an empty array
          resData.merchant.images = [];
        }
      }
      
      setData(resData);
    } catch (error: any) {
      console.error(error);
      message.error('获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onFinish = async (values: any) => {
    if (!user) {
      message.warning('请先登录后再发表评论');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/api/reviews', {
        merchantId: id,
        rating: values.rating,
        content: values.content,
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      message.success('评论发表成功！');
      form.resetFields();
      setSelectedRating(0);
      setHoverRating(0);
      setShowReviewForm(false);
      
      // Update merchant data with new review count and rating
      if (response.data.merchant && data) {
        const updatedData = {
          ...data,
          merchant: {
            ...data.merchant,
            avg_rating: response.data.merchant.avg_rating,
            review_count: response.data.merchant.review_count
          }
        };
        
        // Add the new review to the recent comments list
        if (response.data.review) {
          updatedData.recentComments = [response.data.review, ...data.recentComments];
        }
        
        setData(updatedData);
      }
      
      // Refresh all data to ensure consistency
      setTimeout(() => {
        fetchData();
      }, 100);
    } catch (error) {
      message.error('评论失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const onReplyFinish = async (reviewId: number, values: any) => {
    try {
      await axios.post(`/api/reviews/${reviewId}/reply`, {
        reply_content: values.reply_content
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      message.success('回复成功');
      setReplyingTo(null);
      replyForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('回复失败');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      message.warning('请先登录后再收藏');
      navigate('/login');
      return;
    }
    try {
      const response = await axios.post(`/api/merchants/${id}/favorite`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const isFav = response.data.is_favorite;
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          merchant: {
            ...prev.merchant,
            is_favorite: isFav
          }
        };
      });
      if (isFav) {
        message.success({ content: '😍 我真香了！', key: 'fav-toast' });
        setAnimatingFav(true);
        setTimeout(() => setAnimatingFav(false), 600);
      } else {
        message.info({ content: '🥲 突然就不香了~', key: 'fav-toast' });
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Spin size="large" /></div>;
  if (!data || !data.merchant) return <div className="text-center p-20">未找到商户信息</div>;

  const { merchant, recentComments, needLogin, hasCommented } = data;
  const merchantImages = Array.isArray(merchant.images) ? merchant.images : [];
  
  // Determine which comments to show
  const displayedComments = showAllReviews ? recentComments : recentComments.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Merchant Info Card */}
      <Card className="mb-8 border border-gray-100 shadow-sm overflow-hidden rounded-2xl" bodyStyle={{ padding: 0 }}>
        <div className="flex flex-col md:flex-row">
          {/* Fixed aspect ratio container for the main image */}
          <div className="w-full md:w-[400px] h-[240px] md:h-auto flex-shrink-0 bg-gray-50 relative overflow-hidden" style={{ minHeight: '320px' }}>
            <img 
              src={(Array.isArray(merchant.images) && merchant.images.length > 0) ? merchant.images[0] : getFallbackImage(merchant.category_name)} 
              alt={merchant.name} 
              className="w-full h-full object-cover absolute inset-0" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = getFallbackImage(merchant.category_name);
              }}
            />
          </div>
          <div className="flex-1 p-6 flex flex-col min-w-0" style={{ minHeight: '320px' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-start gap-3 mb-2">
                  <span className="w-2/3 break-words whitespace-normal leading-tight">{merchant.name}</span>
                  <Button 
                    type="text" 
                    icon={
                      <HeartFilled 
                        className={`text-red-500 transition-all duration-300 ${merchant.is_favorite ? 'opacity-100' : 'opacity-0 absolute'} ${animatingFav ? 'animate-zhenxiang text-xl' : 'text-xl'}`} 
                      />
                    } 
                    onClick={handleToggleFavorite}
                    className="p-0 hover:bg-transparent relative mt-1"
                  >
                    {!merchant.is_favorite && <HeartOutlined className="text-gray-400 text-xl hover:text-red-500 transition-colors" />}
                  </Button>
                </h1>
                <Space>
                  <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded text-xs inline-block">
                    {merchant.category_name}
                  </span>
                  <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded text-xs inline-block">
                    {merchant.city}
                  </span>
                </Space>
              </div>
              <div className="text-right">
                <div className="flex items-end justify-end gap-2">
                  <div className="text-3xl font-bold text-orange-500 leading-none">
                    {Number(merchant.avg_rating).toFixed(1)}
                  </div>
                  <span className="text-orange-500 font-medium text-sm mb-1">
                    {getRatingText(Number(merchant.avg_rating))}
                  </span>
                </div>
                <Rate disabled value={Number(merchant.avg_rating)} allowHalf className="text-orange-400 text-sm mt-1" />
                <div className="text-gray-400 text-xs mt-1">{merchant.review_count}个真香现场</div>
              </div>
            </div>

            <div className="space-y-3 text-gray-600">
              <div className="flex items-center gap-2">
                <EnvironmentOutlined className="text-orange-500" />
                <span>{merchant.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneOutlined className="text-orange-500" />
                <span>{merchant.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-orange-500" />
                  <span>营业时间: {merchant.business_hours}</span>
                </div>
                {merchant.status && (
                  <span className={`px-2 py-0.5 rounded text-xs inline-block text-white ${merchant.status === '营业' || merchant.status === '营业中' ? 'bg-orange-500' : merchant.status === '休息' || merchant.status === '休息中' ? 'bg-[#fdba74]' : 'bg-[#6b7280]'}`}>
                    {merchant.status === '营业中' ? '营业' : merchant.status === '休息中' ? '休息' : merchant.status}
                  </span>
                )}
              </div>
            </div>

            <Divider className="my-4" />
            <div className="flex justify-between items-start gap-4 mb-4">
              <p className="text-gray-500 italic m-0 flex-1">{merchant.description}</p>
              {user?.role === 'merchant' && user?.userId === merchant.owner_id && (
                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => navigate('/admin/merchants')}
                  size="small"
                  className="flex-shrink-0"
                >
                  管理门店
                </Button>
              )}
            </div>
            
            {merchantImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {merchantImages.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`${merchant.name}-${idx}`} 
                    className="w-20 h-20 object-cover rounded-lg border border-gray-100 cursor-pointer hover:border-orange-500 transition-colors"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-8">
        {/* Post Review Form - Moved to top */}
        {!needLogin && showReviewForm && (
          <div className="w-full" aria-labelledby="review-form-title">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 id="review-form-title" className="text-lg font-bold m-0">记录我的真香时刻</h3>
                <Button type="text" className="text-gray-400 p-0" onClick={() => {
                  setShowReviewForm(false);
                  form.resetFields();
                  setSelectedRating(0);
                  setHoverRating(0);
                }} aria-label="取消评价">取消</Button>
              </div>
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item 
                  name="rating" 
                  label={<span className="font-medium text-gray-700">真香指数</span>} 
                  rules={[{ required: true, message: '请给商户打分' }]}
                  className="mb-6"
                >
                  <div className="flex items-center gap-4">
                    <Rate 
                      allowHalf 
                      className="text-orange-400 text-2xl" 
                      onChange={(val) => {
                        setSelectedRating(val);
                        form.setFieldsValue({ rating: val });
                      }}
                      onHoverChange={(val) => setHoverRating(val)}
                      aria-label="商户评分星级选择"
                    />
                    <span 
                      className="text-orange-500 font-bold text-base min-w-[80px] transition-all duration-200"
                      aria-live="polite"
                      role="status"
                    >
                      {getRatingText(currentRatingValue)}
                    </span>
                  </div>
                </Form.Item>
                <Form.Item name="content" label={<span className="font-medium text-gray-700">我的真香现场</span>} rules={[{ required: true, message: '请输入评价内容' }]}>
                  <Input.TextArea rows={4} placeholder="这家店怎么样？环境和服务如何？" className="rounded-lg" aria-label="评价内容输入框" />
                </Form.Item>
                <Form.Item className="mb-0 text-right">
                  <Button type="primary" htmlType="submit" loading={submitting} className="bg-orange-500 hover:bg-orange-600 border-none px-8 rounded-full h-10 font-medium">
                    告诉大家
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold m-0">网友的真香现场 ({recentComments?.length || 0})</h2>
              {!needLogin && !showReviewForm && (
                <Button 
                  type="primary" 
                  className="bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700 border-none px-6 rounded-full font-medium transition-colors"
                  onClick={() => setShowReviewForm(true)}
                >
                  分享我的真香时刻
                </Button>
              )}
            </div>
            {needLogin ? (
              <Button type="primary" className="bg-orange-500 border-none rounded-full" onClick={() => navigate('/login')}>
                登录后查看更多 / 写评价
              </Button>
            ) : null}
          </div>
          <List
            itemLayout="horizontal"
            dataSource={displayedComments}
            locale={{ emptyText: '暂无真香现场，快来抢沙发吧！' }}
            renderItem={(review) => (
              <List.Item className="bg-white p-6 md:p-8 rounded-2xl mb-6 shadow-sm border border-gray-100 items-center hover:shadow-md transition-shadow">
                <div className="w-full flex flex-row gap-4 md:gap-8 items-center">
                  <div className="flex-shrink-0 ml-4 md:ml-6">
                    <Avatar 
                      size={56} 
                      src={review.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(review.user_name || 'user')}&backgroundColor=ffd5dc,ffdfbf`} 
                      icon={<UserOutlined />} 
                      className="mt-0 shadow-sm border border-gray-50"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center pr-2 mb-0">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-lg text-gray-800">{review.user_name || '我是大食家'}</span>
                        {user && user.userId === review.user_id && (
                          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">我</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-sm flex-shrink-0">
                        {new Date(review.created_at).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                    <div className="w-full mt-2 pr-2 md:pr-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Rate disabled value={review.rating} allowHalf className="text-orange-400 text-sm" />
                        <span className="text-orange-500 font-medium text-sm">{getRatingText(review.rating)}</span>
                      </div>
                      <p className="text-gray-700 text-base leading-relaxed break-words whitespace-pre-wrap">{review.content}</p>
                      
                      {review.reply_content && (
                        <div className="mt-6 p-4 bg-orange-50 rounded-xl w-full border-l-4 border-orange-500">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-orange-600 font-bold text-sm">商家回复：</span>
                            <span className="text-gray-400 text-xs">
                              {new Date(review.replied_at!).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 text-base break-words whitespace-pre-wrap leading-relaxed mt-2">{review.reply_content}</p>
                        </div>
                      )}

                      {user?.role === 'merchant' && user?.userId === merchant.owner_id && !review.reply_content && (
                        <div className="mt-6 w-full">
                          {replyingTo === review.id ? (
                            <Form form={replyForm} onFinish={(values) => onReplyFinish(review.id, values)} layout="vertical" className="w-full mt-4">
                              <Form.Item 
                                name="reply_content" 
                                rules={[
                                  { required: true, message: '请输入回复内容' },
                                  { max: 200, message: '回复内容不能超过200字' }
                                ]}
                              >
                                <Input.TextArea 
                                  rows={4} 
                                  placeholder="输入回复内容（限200字）..." 
                                  maxLength={200}
                                  showCount
                                  className="w-full rounded-lg" 
                                />
                              </Form.Item>
                              <Form.Item className="mb-0 text-right">
                                <Space>
                                  <Button onClick={() => setReplyingTo(null)}>取消</Button>
                                  <Button type="primary" htmlType="submit" className="bg-orange-500 border-none">提交</Button>
                                </Space>
                              </Form.Item>
                            </Form>
                          ) : (
                            <Button type="link" onClick={() => setReplyingTo(review.id)} className="p-0 mt-2 text-orange-500 hover:text-orange-600">回复评论</Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />

          {/* Move "View More" button here, under the list */}
          {!needLogin && merchant.review_count > 3 && !showAllReviews && (
            <div className="text-center mt-8 mb-8">
              <Button type="default" className="text-orange-500 border-orange-500 rounded-full px-8 py-2 h-auto" onClick={() => setShowAllReviews(true)}>
                查看更多真香现场 (共 {merchant.review_count} 个)
              </Button>
            </div>
          )}
        </div>

        {/* Post Review Form */}
        {/* The form has been moved above the reviews list */}
      </div>
    </div>
  );
};

export default MerchantDetail;
