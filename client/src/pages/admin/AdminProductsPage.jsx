import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Package,
  Heart,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { SNACK_CATEGORIES } from '../../data/hostelConfig';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useSocketEvent, useAdminSocket } from '../../hooks/useSocket';

const PRESET_PACK_IMAGES = [
  { label: "Lay's Classic", url: '/packs/lays.jpg', brand: "Lay's", weight: '52g', category: 'chips' },
  { label: 'Maggi Noodles', url: '/packs/maggi.jpg', brand: 'Nestlé', weight: '70g', category: 'noodles' },
  { label: 'Dairy Milk', url: '/packs/dairy_milk.jpg', brand: 'Cadbury', weight: '36g', category: 'chocolates' },
  { label: 'Coca-Cola Can', url: '/packs/coke.jpg', brand: 'Coca-Cola', weight: '300ml', category: 'drinks' },
  { label: 'Oreo Biscuits', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80', brand: 'Cadbury', weight: '120g', category: 'biscuits' },
  { label: 'Kurkure Munch', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80', brand: 'Kurkure', weight: '52g', category: 'namkeen' },
];

const initialProductForm = {
  name: '',
  category: 'general',
  price: '',
  sellingPrice: '',
  selling_price: '',
  stock: 25,
  brand: '',
  weight: '',
  description: '',
  image: '',
  imageUrl: '',
  cloudinaryPublicId: null,
  isAvailable: true,
  isActive: true,
  isVeg: true,
  hostelFavorite: false,
};

export const AdminProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState(searchParams.get('action') === 'new' ? 'form' : 'list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialProductForm);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Cloudinary image upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useAdminSocket();

  useEffect(() => {
    loadProducts();
  }, []);

  useSocketEvent('inventory:updated', () => {
    loadProducts();
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenAdd();
    }
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await apiService.getProducts({ limit: 200, includeInactive: 'true' });
      setProducts(res.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      ...initialProductForm,
      name: '',
      price: '',
      sellingPrice: '',
      selling_price: '',
      stock: '',
      brand: '',
      weight: '',
      description: '',
      image: '',
      imageUrl: '',
      cloudinaryPublicId: null,
      isActive: true,
      isAvailable: true,
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError(null);
    setViewMode('form');
  };

  const handleOpenEdit = (product) => {
    setEditingId(product._id);
    const existingImg = product.imageUrl || product.image || '';
    const resolvedPrice = product.price ?? product.sellingPrice ?? product.selling_price ?? 20;
    setForm({
      name: product.name || '',
      category: product.category || 'general',
      price: resolvedPrice,
      sellingPrice: resolvedPrice,
      selling_price: resolvedPrice,
      stock: product.stock ?? 50,
      brand: product.brand || "Bro Code",
      weight: product.weight || '50g',
      description: product.description || '',
      image: existingImg,
      imageUrl: existingImg,
      cloudinaryPublicId: product.cloudinaryPublicId || null,
      isAvailable: product.isAvailable ?? product.isActive ?? true,
      isActive: product.isActive ?? product.isAvailable ?? true,
      isVeg: product.isVeg ?? true,
      hostelFavorite: product.hostelFavorite ?? false,
    });
    setSelectedFile(null);
    setPreviewUrl(existingImg);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError(null);
    setViewMode('form');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: val,
      };
      if (name === 'price' || name === 'sellingPrice' || name === 'selling_price') {
        next.price = val;
        next.sellingPrice = val;
        next.selling_price = val;
      }
      return next;
    });
  };

  const handleSelectPresetImage = (preset) => {
    setSelectedFile(null);
    setPreviewUrl(preset.url);
    setUploadError(null);
    setForm((prev) => ({
      ...prev,
      image: preset.url,
      imageUrl: preset.url,
      cloudinaryPublicId: null,
      brand: prev.brand || preset.brand,
      weight: prev.weight || preset.weight,
      category: prev.category === 'chips' ? preset.category : prev.category,
    }));
  };

  const validateAndSelectFile = (file) => {
    setUploadError(null);
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      const err = 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.';
      setUploadError(err);
      toast.error(err);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const err = `File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`;
      setUploadError(err);
      toast.error(err);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadError(null);
    setUploadProgress(0);
    setForm((prev) => ({
      ...prev,
      image: '',
      imageUrl: '',
      cloudinaryPublicId: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    if (!selectedFile && !previewUrl && !form.image && !form.imageUrl) {
      const err = 'Please upload or select an image for this snack.';
      setUploadError(err);
      toast.error(err);
      return;
    }

    try {
      setSubmitting(true);
      setUploadError(null);

      let finalImageUrl = form.imageUrl || form.image;
      let finalCloudinaryPublicId = form.cloudinaryPublicId || null;

      // 1. Upload file to Cloudinary if new file is selected
      if (selectedFile) {
        setIsUploading(true);
        setUploadProgress(15);

        try {
          const uploadRes = await apiService.uploadProductImage(selectedFile, (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(Math.min(95, percent));
            }
          });

          setUploadProgress(100);
          finalImageUrl = uploadRes.data?.imageUrl || uploadRes.data?.secure_url;
          finalCloudinaryPublicId = uploadRes.data?.cloudinaryPublicId || uploadRes.data?.public_id || null;

          if (!finalImageUrl) {
            throw new Error('Cloudinary response did not return a valid secure URL');
          }
        } catch (uploadErr) {
          const errMsg =
            uploadErr.message ||
            'Failed to upload image to Cloudinary. Please check your credentials in server/.env.';
          setUploadError(errMsg);
          toast.error(errMsg);
          setIsUploading(false);
          setSubmitting(false);
          return; // Strictly abort saving product if image upload fails
        }
      }

      // Safeguard: Never save browser blob URLs
      if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
        const err = 'Temporary local blob cannot be saved. Please upload the image to Cloudinary.';
        setUploadError(err);
        toast.error(err);
        setSubmitting(false);
        setIsUploading(false);
        return;
      }

      const rawPrice =
        form.price !== '' && form.price !== undefined && form.price !== null
          ? form.price
          : form.sellingPrice !== '' && form.sellingPrice !== undefined && form.sellingPrice !== null
          ? form.sellingPrice
          : form.selling_price;
      const parsedPrice = parseFloat(rawPrice);
      const validPrice = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;
      const parsedStock = parseInt(form.stock, 10);
      const validStock = !isNaN(parsedStock) && parsedStock >= 0 ? parsedStock : 0;

      const payload = {
        ...form,
        category: form.category || 'general',
        description: form.description?.trim() || `${form.name || 'Snack'} - Fresh and delicious midnight hostel treat.`,
        image: finalImageUrl,
        imageUrl: finalImageUrl,
        cloudinaryPublicId: finalCloudinaryPublicId,
        price: validPrice,
        sellingPrice: validPrice,
        selling_price: validPrice,
        stock: validStock,
        isActive: form.isActive !== false,
        isAvailable: form.isActive !== false,
      };

      if (editingId) {
        await apiService.updateProduct(editingId, payload);
        toast.success('Product updated successfully!');
      } else {
        await apiService.createProduct(payload);
        toast.success('Product created with Cloudinary image!');
      }

      setSelectedFile(null);
      setPreviewUrl('');
      setViewMode('list');
      loadProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await apiService.deleteProduct(id);
      toast.success('Product removed');
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading snack inventory..." />;
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

    let matchesStatus = true;
    if (selectedStatus === 'active') {
      matchesStatus = p.stock > 0 && p.isActive !== false && p.isAvailable !== false;
    } else if (selectedStatus === 'low') {
      matchesStatus = p.stock > 0 && p.stock <= 10;
    } else if (selectedStatus === 'out') {
      matchesStatus = p.stock <= 0;
    } else if (selectedStatus === 'inactive') {
      matchesStatus = p.isActive === false || p.isAvailable === false;
    }

    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // VIEW 2: ADD / EDIT PRODUCT (Matching Middle-Right of Mockup)
  // ==========================================
  if (viewMode === 'form') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingId
                ? 'Update snack details and stock availability'
                : 'Add a new snack item to your inventory'}
            </p>
          </div>

          <button
            onClick={() => setViewMode('list')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>
        </div>

        {/* 2-Column Layout matching Middle-Right Mockup */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left 2 Cols: Form Inputs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Row 1: Name & Initial Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Maggi 2-Minute Masala Noodles"
                  required
                  className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="e.g. 25"
                  className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Row 2: Price & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="any"
                  required
                  placeholder="e.g. 20"
                  className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="e.g. Nestlé, Lay's, Cadbury"
                  className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Row 3: Package Size & Storefront Availability Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Package Size / Weight (Optional)
                </label>
                <input
                  type="text"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="e.g. 70g, 300ml, 52g"
                  className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Availability Status *
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {form.isActive ? 'Active Store Product' : 'Inactive (Hidden)'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {form.isActive
                        ? 'Visible to customers for purchase'
                        : 'Hidden from customer store'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setForm((prev) => ({ ...prev, isActive: val, isAvailable: val }));
                    }}
                    className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange"
                  />
                </label>
              </div>
            </div>

            {/* Row 4: Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Delicious midnight snack with rich flavor. Perfect companion for late night hostel studies."
                className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs resize-none"
              />
            </div>

            {/* Row 5: Product Images upload / preset picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Product Image *
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  PNG, JPEG, WebP • Max 5MB
                </span>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {/* Upload or Selected Preview Zone */}
              <div className="space-y-3">
                {previewUrl || form.imageUrl || form.image ? (
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Thumbnail & Info */}
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-brand-orange bg-white p-2 relative flex items-center justify-center shrink-0 shadow-xs">
                        <img
                          src={previewUrl || form.imageUrl || form.image}
                          alt="Snack Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-orange text-black flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {selectedFile ? selectedFile.name : 'Image Ready'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {selectedFile
                            ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Selected from computer`
                            : form.cloudinaryPublicId
                            ? 'Cloudinary hosted image'
                            : 'Standard image URL'}
                        </div>
                        {form.cloudinaryPublicId && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Cloudinary ID: {form.cloudinaryPublicId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Replace & Remove */}
                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting || isUploading}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-orange bg-white text-slate-700 hover:text-brand-orange text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Replace</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={submitting || isUploading}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Click to upload & Drag and Drop zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      isDragging
                        ? 'border-brand-orange bg-amber-50/30 scale-[1.01]'
                        : 'border-slate-200 hover:border-brand-orange bg-slate-50/50 hover:bg-amber-50/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100/60 text-brand-orange flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to upload snack image, or drag and drop
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      JPEG, PNG, or WebP up to 5 MB
                    </span>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-1.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange" />
                        Uploading image to Cloudinary...
                      </span>
                      <span className="font-black text-brand-orange">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-orange h-full transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Error Banner */}
                {uploadError && (
                  <div className="flex items-start space-x-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div className="flex-1">
                      <span className="font-bold">Upload Error: </span>
                      <span>{uploadError}</span>
                    </div>
                  </div>
                )}

                {/* Quick Presets Carousel */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                    Or select a common quick snack pack preset:
                  </span>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {PRESET_PACK_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPresetImage(preset)}
                        className={`w-12 h-12 rounded-xl border p-1 bg-white hover:border-brand-orange transition-all shrink-0 ${
                          form.image === preset.url
                            ? 'border-brand-orange ring-2 ring-brand-orange/30'
                            : 'border-slate-200'
                        }`}
                        title={preset.label}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct image url input fallback */}
                <div>
                  <input
                    type="text"
                    name="image"
                    value={form.image}
                    onChange={(e) => {
                      handleChange(e);
                      setPreviewUrl(e.target.value);
                    }}
                    placeholder="Or paste direct image URL (https://...)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3 py-1.5 text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                disabled={submitting || isUploading}
                className="px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isUploading}
                className="px-7 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-2"
              >
                {(submitting || isUploading) && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {isUploading
                    ? 'Uploading Image...'
                    : submitting
                    ? 'Saving Product...'
                    : editingId
                    ? 'Update Product'
                    : 'Save Product'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Col: Product Preview Card matching Middle-Right Mockup */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Product Preview
            </h3>

            {/* Card Mockup */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm relative group">
              {/* Wishlist Heart */}
              <button
                type="button"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>

              {/* Product Image */}
              <div className="w-full aspect-square rounded-xl bg-slate-50/70 p-4 flex items-center justify-center mb-3">
                <img
                  src={previewUrl || form.imageUrl || form.image || '/packs/lays.jpg'}
                  alt={form.name || 'Snack'}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                  }}
                />
              </div>

              {/* Title */}
              <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-2">
                {form.name || "Lay's Classic Salted (52g)"}
              </h4>

              {/* Price & In Stock pill */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-base font-black text-slate-900" data-testid="product-preview-price">
                  {formatCurrency(
                    form.price !== '' && form.price !== undefined && form.price !== null
                      ? form.price
                      : form.sellingPrice !== '' && form.sellingPrice !== undefined && form.sellingPrice !== null
                      ? form.sellingPrice
                      : form.selling_price !== '' && form.selling_price !== undefined && form.selling_price !== null
                      ? form.selling_price
                      : 0
                  )}
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  {form.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Description snippet */}
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                {form.description ||
                  'Classic salted potato chips with the perfect crunch. A timeless favourite for every mood.'}
              </p>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: PRODUCTS TABLE & MOBILE CARDS (Matching Top-Right of Mockup)
  // ==========================================
  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header matching Top-Right of Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your snack inventory
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-extrabold text-xs shadow-md transition-all active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter Row matching Top-Right of Mockup */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-48 bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Products</option>
            <option value="active">In Stock</option>
            <option value="low">Low Stock (≤10)</option>
            <option value="out">Out of Stock</option>
            <option value="inactive">Inactive / Hidden</option>
          </select>
        </div>
      </div>

      {/* MOBILE VIEW (< md): Mobile Product Cards */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-400 text-xs">
            No products match your criteria. Click "+ Add Product" to create one.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isInactive = p.isActive === false || p.isAvailable === false;
            const isOut = p.stock <= 0;
            const isLow = p.stock > 0 && p.stock <= 10;

            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={p.imageUrl || p.image}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</h3>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{p.brand || 'Bro Code'}</span>
                        {p.weight && <span>• {p.weight}</span>}
                      </div>
                      <div className="text-sm font-black text-slate-900 mt-1">
                        {formatCurrency(p.price ?? p.sellingPrice ?? p.selling_price)}
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="shrink-0">
                    {isInactive ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] border border-slate-300">
                        Inactive
                      </span>
                    ) : isOut ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-extrabold text-[10px] border border-rose-200">
                        Out of Stock
                      </span>
                    ) : isLow ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Stock count + Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-600">
                    Stock:{' '}
                    <span className={isOut ? 'text-rose-600 font-black' : 'text-slate-900'}>
                      {p.stock} units
                    </span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.name)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP/TABLET VIEW (>= md): Full Products Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === filteredProducts.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Image</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products match your criteria. Click "+ Add Product" to create one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isChecked = selectedIds.includes(p._id);
                  const isInactive = p.isActive === false || p.isAvailable === false;
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= 10;

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isChecked ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(p._id)}
                          className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                        />
                      </td>

                      {/* Image Thumbnail matching Mockup */}
                      <td className="py-3 px-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={p.imageUrl || p.image}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                        {p.weight && (
                          <div className="text-[10px] text-slate-400">{p.weight}</div>
                        )}
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {p.brand || 'Bro Code'}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-black text-slate-900">
                        {formatCurrency(p.price ?? p.sellingPrice ?? p.selling_price)}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span className={isOut ? 'text-rose-600 font-black' : ''}>
                          {p.stock}
                        </span>
                      </td>

                      {/* Status Pills */}
                      <td className="py-3 px-4">
                        {isInactive ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] border border-slate-300">
                            Inactive
                          </span>
                        ) : isOut ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-extrabold text-[10px] border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions: Edit pencil, Delete trash matching Mockup */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
