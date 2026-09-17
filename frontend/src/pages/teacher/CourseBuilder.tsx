import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalizedValue } from '../../utils/localized';
import { PageShell, Input, Button, Card, Toast, InlineLoader } from '../../components/ui';
import { courseApi } from '../../services/course.api';
import { categoryApi, Category } from '../../services/category.api';
import { uploadApi } from '../../services/upload.api';
import { 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  DollarSign, 
  Info,
  CheckCircle2
} from 'lucide-react';

const CourseBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backCoursesUrl = (location.state as any)?.from || (isAdmin ? '/admin-dashboard/content' : '/teacher-courses');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'all' as 'all' | 'beginner' | 'intermediate' | 'advanced',
    price: '',
    estimatedPrice: '',
    thumbnailUrl: '',
    isFree: false,
  });

  // Fetch danh sách categories từ API để điền vào dropdown
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAllCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] = categoriesData?.data?.categories || [];

  const createCourseMutation = useMutation({
    mutationFn: (data: any) => courseApi.createCourse(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setToast({ 
        message: t('teacher.courseBuilder.messages.success', 'Tạo khóa học nháp thành công! Đang chuyển đến trình soạn giáo án...'), 
        type: 'success' 
      });
      // Redirect sang curriculum editor
      const newCourseId = res?.data?.course?._id || res?.data?._id || res?.course?._id;
      setTimeout(() => navigate(newCourseId ? `/teacher/courses/${newCourseId}/curriculum` : backCoursesUrl, { state: { from: backCoursesUrl } }), 1200);
    },
    onError: (error: any) => {
      setToast({ 
        message: error.response?.data?.message || t('common.error', 'Tạo khóa học thất bại.'), 
        type: 'error' 
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFreeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      isFree: checked,
      price: checked ? '0' : (prev.price === '0' ? '' : prev.price),
      estimatedPrice: checked ? '' : prev.estimatedPrice,
    }));
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({ 
        message: t('teacher.courseBuilder.messages.imageTooLarge', 'Kích thước tệp vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.'), 
        type: 'error' 
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      const uploadedUrl = res.data?.url || res.data?.data?.url;
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, thumbnailUrl: uploadedUrl }));
        setToast({ 
          message: t('teacher.courseBuilder.messages.uploadSuccess', 'Tải ảnh bìa lên thành công!'), 
          type: 'success' 
        });
      }
    } catch (err: any) {
      setToast({ 
        message: err.response?.data?.message || t('teacher.courseBuilder.messages.uploadFailed', 'Tải ảnh lên thất bại, vui lòng thử lại.'), 
        type: 'error' 
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const salePrice = Number(formData.price) || 0;
  const origPrice = Number(formData.estimatedPrice) || 0;
  const discountPercent = !formData.isFree && origPrice > salePrice && salePrice > 0
    ? Math.round(((origPrice - salePrice) / origPrice) * 100)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setToast({ 
        message: t('teacher.courseBuilder.messages.missingTitle', 'Vui lòng nhập tiêu đề khóa học.'), 
        type: 'error' 
      });
      return;
    }

    if (!formData.category) {
      setToast({ 
        message: t('teacher.courseBuilder.messages.missingCategory', 'Vui lòng chọn danh mục cho khóa học.'), 
        type: 'error' 
      });
      return;
    }

    if (!formData.description.trim()) {
      setToast({ 
        message: t('teacher.courseBuilder.messages.missingDescription', 'Vui lòng nhập mô tả cho khóa học.'), 
        type: 'error' 
      });
      return;
    }

    if (!formData.isFree && origPrice > 0 && origPrice < salePrice) {
      setToast({ 
        message: t('teacher.courseBuilder.messages.invalidPrice', 'Giá bán thực tế không thể lớn hơn giá niêm yết.'), 
        type: 'error' 
      });
      return;
    }

    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      level: formData.level,
      price: formData.isFree ? 0 : Math.max(0, salePrice),
      thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
      status: 'draft',
    };

    if (!formData.isFree && origPrice > 0) {
      payload.estimatedPrice = origPrice;
      if (discountPercent > 0) {
        payload.discountPercentage = discountPercent;
      }
    }

    createCourseMutation.mutate(payload);
  };

  return (
    <PageShell wide>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-3">
          <Link
            to={backCoursesUrl}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('teacher.courseBuilder.backToCourses', '← Quay lại danh sách khóa học')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('teacher.courseBuilder.badge', 'Studio Thiết Kế Khóa Học')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t('teacher.courseBuilder.title', 'Tạo khóa học mới')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {t('teacher.courseBuilder.subtitle', 'Thiết lập thông tin cơ bản, ảnh bìa và học phí trước khi xây dựng chương trình giảng dạy.')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Form Grid */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Basic Information (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-6 sm:p-7 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    {t('teacher.courseBuilder.sections.basicInfo', 'Thông tin cơ bản')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('teacher.courseBuilder.sections.basicInfoDesc', 'Tiêu đề, danh mục, trình độ và mô tả tổng quan khóa học')}
                  </p>
                </div>

                {/* Course Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="title" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t('teacher.courseBuilder.fields.title', 'Tiêu đề khóa học')} <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">
                      {formData.title.length}/100
                    </span>
                  </div>
                  <Input
                    id="title"
                    name="title"
                    maxLength={100}
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t('teacher.courseBuilder.fields.titlePlaceholder', 'VD: Thiết kế hệ thống phân tán từ Zero đến Hero...')}
                    required
                    className="w-full font-medium"
                  />
                </div>

                {/* Category & Level in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Category */}
                  <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t('teacher.courseBuilder.fields.category', 'Danh mục khóa học')} <span className="text-rose-500">*</span>
                    </label>
                    {categoriesLoading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 min-h-[48px]">
                        <InlineLoader />
                        <span className="text-xs text-slate-400">{t('teacher.courseBuilder.fields.categoryLoading', 'Đang tải danh mục...')}</span>
                      </div>
                    ) : (
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#18181B] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer min-h-[48px]"
                      >
                        <option value="" disabled>{t('teacher.courseBuilder.fields.categorySelect', '-- Chọn danh mục khóa học --')}</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {lv(cat.name)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Target Level */}
                  <div className="space-y-2">
                    <label htmlFor="level" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t('teacher.courseBuilder.fields.level', 'Trình độ phù hợp')}
                    </label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#18181B] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer min-h-[48px]"
                    >
                      <option value="all">{t('teacher.courseBuilder.fields.levelAll', 'Mọi trình độ (All Levels)')}</option>
                      <option value="beginner">{t('teacher.courseBuilder.fields.levelBeginner', 'Người mới bắt đầu (Beginner)')}</option>
                      <option value="intermediate">{t('teacher.courseBuilder.fields.levelIntermediate', 'Trung cấp (Intermediate)')}</option>
                      <option value="advanced">{t('teacher.courseBuilder.fields.levelAdvanced', 'Nâng cao (Advanced)')}</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="description" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t('teacher.courseBuilder.fields.description', 'Mô tả khóa học')} <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">
                      {formData.description.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    maxLength={1000}
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#18181B] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                    placeholder={t('teacher.courseBuilder.fields.descriptionPlaceholder', 'Mô tả chi tiết mục tiêu khóa học, kiến thức học viên sẽ đạt được sau khi hoàn thành...')}
                    required
                  />
                </div>
              </Card>
            </div>

            {/* Right Column: Thumbnail, Pricing & Next Steps (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Thumbnail Media Card */}
              <Card className="p-6 sm:p-7 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
                <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-indigo-500" />
                      {t('teacher.courseBuilder.sections.media', 'Ảnh bìa khóa học')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('teacher.courseBuilder.sections.mediaDesc', 'Ảnh bìa tỷ lệ 16:9 sắc nét, thu hút học viên')}
                    </p>
                  </div>
                  {formData.thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('teacher.courseBuilder.fields.removeImage', 'Gỡ ảnh')}
                    </button>
                  )}
                </div>

                {/* Thumbnail Live Preview Box */}
                <div className="relative aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center group">
                  {formData.thumbnailUrl ? (
                    <>
                      <img
                        src={formData.thumbnailUrl}
                        alt="Course Preview"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-900 text-xs font-semibold shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {t('teacher.courseBuilder.fields.changeImage', 'Đổi ảnh khác')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isUploadingImage ? t('teacher.courseBuilder.fields.uploading', 'Đang tải lên...') : t('teacher.courseBuilder.fields.uploadImage', 'Tải ảnh từ máy')}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-[200px] mb-3">
                        {t('teacher.courseBuilder.fields.thumbnailTip', 'Khuyến nghị 16:9 (1280x720px), dưới 5MB')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                      >
                        {t('teacher.courseBuilder.fields.uploadImage', 'Tải ảnh từ máy')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileUpload}
                />

                {/* Direct Image URL input */}
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="thumbnailUrl" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {t('teacher.courseBuilder.fields.thumbnailUrl', 'Đường dẫn ảnh bìa (URL)')}
                  </label>
                  <Input
                    id="thumbnailUrl"
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleChange}
                    placeholder={t('teacher.courseBuilder.fields.thumbnailPlaceholder', 'https://images.unsplash.com/...')}
                    className="w-full text-xs"
                  />
                </div>
              </Card>

              {/* Pricing & Discount Card */}
              <Card className="p-6 sm:p-7 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
                <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    {t('teacher.courseBuilder.sections.pricing', 'Học phí & Ưu đãi')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('teacher.courseBuilder.sections.pricingDesc', 'Thiết lập học phí thực tế hoặc cung cấp khóa học miễn phí')}
                  </p>
                </div>

                {/* Free Course Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div className="pr-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('teacher.courseBuilder.fields.isFree', 'Khóa học miễn phí (0đ)')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('teacher.courseBuilder.fields.isFreeDesc', 'Học viên có thể ghi danh học ngay mà không cần thanh toán')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleFreeToggle}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/20 cursor-pointer"
                  />
                </div>

                {!formData.isFree && (
                  <div className="space-y-4 pt-1">
                    {/* Sale Price */}
                    <div className="space-y-1.5">
                      <label htmlFor="price" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t('teacher.courseBuilder.fields.salePrice', 'Học phí bán thực tế (đ)')} <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="VD: 499000"
                        required={!formData.isFree}
                        className="w-full font-semibold"
                      />
                    </div>

                    {/* Estimated / Original Price */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="estimatedPrice" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t('teacher.courseBuilder.fields.estimatedPrice', 'Giá gốc niêm yết (đ)')}
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {t('teacher.courseBuilder.fields.estimatedPriceTip', 'Tùy chọn')}
                        </span>
                      </div>
                      <Input
                        id="estimatedPrice"
                        name="estimatedPrice"
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.estimatedPrice}
                        onChange={handleChange}
                        placeholder="VD: 999000"
                        className="w-full"
                      />
                    </div>

                    {/* Discount Badge Calculation */}
                    {discountPercent > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">
                            -{discountPercent}%
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            {t('teacher.courseBuilder.fields.discountBadge', { percent: discountPercent })}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Tiết kiệm {(origPrice - salePrice).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Draft Notice Box */}
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('teacher.courseBuilder.tips.draftNotice', 'Khóa học sẽ được lưu dưới dạng Bản nháp (Draft). Bạn sẽ tiếp tục thêm các chương học, bài giảng video và câu hỏi trắc nghiệm ở bước tiếp theo.')}
                </p>
              </div>

            </div>
          </div>

          {/* Form Bottom Action Bar */}
          <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(backCoursesUrl)}
            >
              {t('teacher.courseBuilder.buttons.cancel', 'Hủy bỏ')}
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={createCourseMutation.isLoading || isUploadingImage}
              disabled={createCourseMutation.isLoading || categoriesLoading || isUploadingImage}
              className="w-full sm:w-auto px-8 font-semibold"
            >
              {createCourseMutation.isLoading
                ? t('teacher.courseBuilder.buttons.creating', 'Đang tạo bản nháp...')
                : t('teacher.courseBuilder.buttons.createAndContinue', 'Tạo bản nháp & Soạn giáo trình →')}
            </Button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </PageShell>
  );
};

export default CourseBuilder;
