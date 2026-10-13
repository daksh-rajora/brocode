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
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Check,
  Star,
  GripVertical,
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

  // Multi-image state
  const [imageList, setImageList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [replacingId, setReplacingId] = useState(null);
  const [directUrlInput, setDirectUrlInput] = useState('');
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

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
      stock: 25,
      brand: '',
      weight: '',
      description: '',
      image: '/packs/lays.jpg',
      imageUrl: '/packs/lays.jpg',
      cloudinaryPublicId: null,
      isActive: true,
      isAvailable: true,
    });
    setImageList([
      {
        id: 'default-pack',
        file: null,
        url: '/packs/lays.jpg',
        publicId: null,
        isCover: true,
        order: 0,
      },
    ]);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError(null);
    setDirectUrlInput('');
    setViewMode('form');
  };

  const handleOpenEdit = (product) => {
    setEditingId(product._id);
    const resolvedPrice = product.price ?? product.sellingPrice ?? product.selling_price ?? 20;

    let initialImages = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      initialImages = product.images.map((img, idx) => ({
        id: img._id || `img-${idx}-${Date.now()}`,
        file: null,
        url: img.url || img.imageUrl || img.image,
        publicId: img.publicId || img.cloudinaryPublicId || null,
        isCover: Boolean(img.isCover),
        order: img.order !== undefined && !isNaN(Number(img.order)) ? Number(img.order) : idx,
      }));
      initialImages.sort((a, b) => (Number(a.order ?? 0)) - (Number(b.order ?? 0)));
    } else if (product.imageUrl || product.image) {
      initialImages = [
        {
          id: `img-0-${Date.now()}`,
          file: null,
          url: product.imageUrl || product.image,
          publicId: product.cloudinaryPublicId || null,
          isCover: true,
          order: 0,
        },
      ];
    }

    if (initialImages.length > 0 && !initialImages.some((i) => i.isCover)) {
      initialImages[0].isCover = true;
    }

    const coverItem = initialImages.find((i) => i.isCover) || initialImages[0];
    const coverUrl = coverItem?.url || '';

    setForm({
      name: product.name || '',
      category: product.category || 'general',
      price: resolvedPrice,
      sellingPrice: resolvedPrice,
      selling_price: resolvedPrice,
      stock: product.stock ?? 50,
      brand: product.brand || 'Bro Code',
      weight: product.weight || '50g',
      description: product.description || '',
      image: coverUrl,
      imageUrl: coverUrl,
      cloudinaryPublicId: coverItem?.publicId || null,
      isAvailable: product.isAvailable ?? product.isActive ?? true,
      isActive: product.isActive ?? product.isAvailable ?? true,
      isVeg: product.isVeg ?? true,
      hostelFavorite: product.hostelFavorite ?? false,
    });
    setImageList(initialImages);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError(null);
    setDirectUrlInput('');
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

  const validateAndAddFiles = (files) => {
    setUploadError(null);
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    const validFiles = [];
    const errors = [];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type.toLowerCase())) {
        errors.push(`"${file.name}" is not a supported format (JPEG, PNG, WebP only).`);
      } else if (file.size > maxSize) {
        errors.push(
          `"${file.name}" exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
        );
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      const errorText = errors.join(' ');
      setUploadError(errorText);
      toast.error(errorText);
    }

    if (validFiles.length > 0) {
      const newItems = validFiles.map((file, idx) => ({
        id: `file-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        url: URL.createObjectURL(file),
        publicId: null,
        isCover: false,
        order: imageList.length + idx,
      }));

      setImageList((prev) => {
        const combined = [...prev, ...newItems];
        if (!combined.some((i) => i.isCover) && combined.length > 0) {
          combined[0].isCover = true;
        }
        return combined.map((item, index) => ({ ...item, order: index }));
      });
      toast.success(
        validFiles.length > 1
          ? `Added ${validFiles.length} images`
          : `Added "${validFiles[0].name}"`
      );
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndAddFiles(files);
    }
    e.target.value = '';
  };

  const handleTriggerReplace = (id) => {
    setReplacingId(id);
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      const err = 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.';
      setUploadError(err);
      toast.error(err);
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const err = `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`;
      setUploadError(err);
      toast.error(err);
      e.target.value = '';
      return;
    }

    setImageList((prev) =>
      prev.map((item) =>
        item.id === replacingId
          ? {
              ...item,
              file,
              url: URL.createObjectURL(file),
              publicId: null,
            }
          : item
      )
    );
    toast.success('Image replaced');
    setReplacingId(null);
    e.target.value = '';
  };

  const handleSetCover = (targetId) => {
    setImageList((prev) =>
      prev.map((item) => ({
        ...item,
        isCover: item.id === targetId,
      }))
    );
    toast.success('Cover image updated');
  };

  const handleRemoveImage = (targetId) => {
    setImageList((prev) => {
      const remaining = prev.filter((item) => item.id !== targetId);
      if (remaining.length > 0 && !remaining.some((i) => i.isCover)) {
        remaining[0].isCover = true;
      }
      return remaining.map((item, index) => ({ ...item, order: index }));
    });
  };

  const handleMoveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= imageList.length) return;

    setImageList((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(newIndex, 0, moved);
      return copy.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleThumbDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleThumbDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleThumbDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setImageList((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(draggedIndex, 1);
      copy.splice(targetIndex, 0, moved);
      return copy.map((item, idx) => ({ ...item, order: idx }));
    });
    setDraggedIndex(null);
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndAddFiles(files);
    }
  };

  const handleSelectPresetImage = (preset) => {
    const newImg = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      file: null,
      url: preset.url,
      publicId: null,
      isCover: imageList.length === 0,
      order: imageList.length,
    };
    setImageList((prev) => {
      const nextList = [...prev, newImg];
      if (!nextList.some((i) => i.isCover) && nextList.length > 0) {
        nextList[0].isCover = true;
      }
      return nextList.map((item, idx) => ({ ...item, order: idx }));
    });
    setForm((prev) => ({
      ...prev,
      brand: prev.brand || preset.brand,
      weight: prev.weight || preset.weight,
      category: prev.category === 'chips' ? preset.category : prev.category,
    }));
    toast.success(`Added ${preset.label} image`);
  };

  const handleAddDirectUrl = () => {
    if (!directUrlInput.trim()) return;
    const newImg = {
      id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      file: null,
      url: directUrlInput.trim(),
      publicId: null,
      isCover: imageList.length === 0,
      order: imageList.length,
    };
    setImageList((prev) => {
      const nextList = [...prev, newImg];
      if (!nextList.some((i) => i.isCover) && nextList.length > 0) {
        nextList[0].isCover = true;
      }
      return nextList.map((item, idx) => ({ ...item, order: idx }));
    });
    setDirectUrlInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    if (imageList.length === 0) {
      const err = 'Please upload at least one image for this snack.';
      setUploadError(err);
      toast.error(err);
      return;
    }

    try {
      setSubmitting(true);
      setUploadError(null);

      let workingList = [...imageList];
      const filesToUpload = workingList.filter((item) => Boolean(item.file));

      if (filesToUpload.length > 0) {
        setIsUploading(true);
        setUploadProgress(15);
        try {
          const fileObjects = filesToUpload.map((i) => i.file);
          const uploadRes = await apiService.uploadProductImages(fileObjects, (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(Math.min(95, percent));
            }
          });

          setUploadProgress(100);
          const uploadedResults = uploadRes.data?.images || [
            {
              url: uploadRes.data?.imageUrl || uploadRes.data?.secure_url,
              publicId: uploadRes.data?.cloudinaryPublicId || uploadRes.data?.public_id,
            },
          ];

          let uploadIdx = 0;
          workingList = workingList.map((item) => {
            if (item.file) {
              const res = uploadedResults[uploadIdx++];
              return {
                ...item,
                file: null,
                url: res?.url || res?.secure_url || item.url,
                publicId: res?.publicId || res?.cloudinaryPublicId || null,
              };
            }
            return item;
          });
        } catch (uploadErr) {
          const errMsg =
            uploadErr.message ||
            'Failed to upload image(s) to Cloudinary. Please check your network and configuration.';
          setUploadError(errMsg);
          toast.error(errMsg);
          setIsUploading(false);
          setSubmitting(false);
          return;
        }
      }

      // Safeguard: Do not save temporary blob URLs
      const hasBlob = workingList.some((img) => img.url && img.url.startsWith('blob:'));
      if (hasBlob) {
        const err = 'Temporary local image could not be processed. Please retry upload.';
        setUploadError(err);
        toast.error(err);
        setSubmitting(false);
        setIsUploading(false);
        return;
      }

      // Ensure cover exists
      if (!workingList.some((i) => i.isCover) && workingList.length > 0) {
        workingList[0].isCover = true;
      }

      const coverItem = workingList.find((i) => i.isCover) || workingList[0];
      const finalImages = workingList.map((item, idx) => ({
        url: item.url,
        publicId: item.publicId || null,
        isCover: item.id === coverItem.id,
        order: idx,
      }));

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
        description:
          form.description?.trim() ||
          `${form.name || 'Snack'} - Fresh and delicious midnight hostel treat.`,
        images: finalImages,
        image: coverItem.url,
        imageUrl: coverItem.url,
        cloudinaryPublicId: coverItem.publicId || null,
        price: validPrice,
        sellingPrice: validPrice,
        selling_price: validPrice,
        stock: validStock,
        isActive: form.isActive !== false,
        isAvailable: form.isActive !== false && validStock > 0,
      };

      if (editingId) {
        await apiService.updateProduct(editingId, payload);
        toast.success('Product updated successfully!');
      } else {
        await apiService.createProduct(payload);
        toast.success('Product created successfully!');
      }

      setImageList([]);
      setSearchParams({}, { replace: true });
      setViewMode('list');
      await loadProducts();
    } catch (error) {
      const detailedMsg =
        Array.isArray(error.errors) && error.errors.length > 0
          ? error.errors.map((err) => `${err.field ? `${err.field}: ` : ''}${err.message}`).join(', ')
          : error.message || 'Failed to save product';
      console.error('[AdminProducts] Save product error:', error);
      toast.error(detailedMsg);
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
            onClick={() => {
              setSearchParams({}, { replace: true });
              setViewMode('list');
            }}
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

            {/* Row 5: Multi-Product Images uploader */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Product Images *
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Add multiple angles, packaging shots, and ingredient details. Drag to reorder.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    data-testid="admin-image-count-badge"
                    className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200"
                  >
                    {imageList.length} {imageList.length === 1 ? 'image' : 'images'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                    PNG, JPEG, WebP • Max 5MB
                  </span>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleReplaceFileChange}
              />

              {/* Main Images Management Area */}
              <div className="space-y-3">
                {imageList.length === 0 ? (
                  /* Empty state dropzone */
                  <div
                    data-testid="image-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      isDragging
                        ? 'border-brand-orange bg-amber-50/40 scale-[1.01]'
                        : 'border-slate-300 hover:border-brand-orange bg-slate-50/60 hover:bg-amber-50/15'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-100/70 text-brand-orange flex items-center justify-center mb-2.5 shadow-xs">
                      <Upload className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to upload snack images, or drag & drop multiple files
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Select multiple JPEG, PNG, or WebP images up to 5 MB each
                    </span>
                  </div>
                ) : (
                  /* Grid of uploaded/selected images */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Drag thumbnails to reorder • Mark one as primary cover image
                      </span>
                      <button
                        type="button"
                        data-testid="add-more-images-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting || isUploading}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-brand-orange/20 text-brand-orange text-xs font-bold transition-all disabled:opacity-50 border border-brand-orange/30"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add More Images</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageList.map((imgItem, idx) => (
                        <div
                          key={imgItem.id}
                          draggable
                          onDragStart={(e) => handleThumbDragStart(e, idx)}
                          onDragOver={(e) => handleThumbDragOver(e, idx)}
                          onDrop={(e) => handleThumbDrop(e, idx)}
                          className={`group relative rounded-2xl bg-white border-2 p-2.5 flex flex-col justify-between transition-all select-none shadow-xs cursor-grab active:cursor-grabbing ${
                            imgItem.isCover
                              ? 'border-brand-orange ring-2 ring-brand-orange/30 shadow-md'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Top row: Cover badge & Order / Drag handle */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            {imgItem.isCover ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange text-black font-black text-[9px] shadow-xs">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                Cover
                              </span>
                            ) : (
                              <button
                                type="button"
                                data-testid={`set-cover-btn-${idx}`}
                                onClick={() => handleSetCover(imgItem.id)}
                                className="text-[9px] font-bold text-slate-500 hover:text-brand-orange hover:underline transition-colors"
                              >
                                Set as Cover
                              </button>
                            )}

                            <div className="flex items-center space-x-1">
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                #{idx + 1}
                              </span>
                              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          </div>

                          {/* Thumbnail preview image */}
                          <div className="w-full aspect-square rounded-xl bg-slate-50/80 p-2 flex items-center justify-center mb-2 overflow-hidden">
                            <img
                              src={imgItem.url}
                              alt={`Product image ${idx + 1}`}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                e.target.src =
                                  'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                              }}
                            />
                          </div>

                          {/* Control buttons toolbar */}
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                            {/* Reorder Left */}
                            <button
                              type="button"
                              data-testid={`move-image-left-${idx}`}
                              disabled={idx === 0 || submitting || isUploading}
                              onClick={() => handleMoveImage(idx, -1)}
                              title="Move Left"
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>

                            {/* Reorder Right */}
                            <button
                              type="button"
                              data-testid={`move-image-right-${idx}`}
                              disabled={idx === imageList.length - 1 || submitting || isUploading}
                              onClick={() => handleMoveImage(idx, 1)}
                              title="Move Right"
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            {/* Replace */}
                            <button
                              type="button"
                              data-testid={`replace-image-btn-${idx}`}
                              disabled={submitting || isUploading}
                              onClick={() => handleTriggerReplace(imgItem.id)}
                              title="Replace Image"
                              className="p-1 rounded-lg border border-slate-200 hover:border-brand-orange text-slate-600 hover:text-brand-orange transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>

                            {/* Remove */}
                            <button
                              type="button"
                              data-testid={`remove-image-btn-${idx}`}
                              disabled={submitting || isUploading}
                              onClick={() => handleRemoveImage(imgItem.id)}
                              title="Remove Image"
                              className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add more drop tile */}
                      <div
                        data-testid="add-more-tile"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-brand-orange bg-amber-50/40'
                            : 'border-slate-300 hover:border-brand-orange bg-slate-50/50 hover:bg-amber-50/20'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-brand-orange flex items-center justify-center mb-1">
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">Add More</span>
                        <span className="text-[9px] text-slate-400">or drop here</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-1.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange" />
                        Uploading image(s) to Cloudinary...
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
                    Or click to append a quick snack pack preset:
                  </span>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {PRESET_PACK_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPresetImage(preset)}
                        className="w-12 h-12 rounded-xl border border-slate-200 p-1 bg-white hover:border-brand-orange transition-all shrink-0 hover:scale-105"
                        title={`Add ${preset.label}`}
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

                {/* Direct image URL input field */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={directUrlInput}
                    onChange={(e) => setDirectUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDirectUrl();
                      }
                    }}
                    placeholder="Or paste direct image URL (https://...)"
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3 py-1.5 text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    data-testid="add-image-url-btn"
                    onClick={handleAddDirectUrl}
                    disabled={!directUrlInput.trim()}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-orange bg-white text-slate-700 text-[11px] font-bold disabled:opacity-40 transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setSearchParams({}, { replace: true });
                  setViewMode('list');
                }}
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
                    ? 'Uploading Images...'
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Product Preview
              </h3>
              <span className="text-[10px] font-bold text-brand-orange bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Cover Image Preview
              </span>
            </div>

            {/* Card Mockup */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm relative group">
              {/* Wishlist Heart */}
              <button
                type="button"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>

              {/* Product Cover Image */}
              <div className="w-full aspect-square rounded-xl bg-slate-50/70 p-4 flex items-center justify-center mb-3 relative">
                <img
                  src={
                    (imageList.find((img) => img.isCover)?.url ||
                      imageList[0]?.url ||
                      '/packs/lays.jpg')
                  }
                  alt={form.name || 'Snack'}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                  }}
                />
                {imageList.length > 1 && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white font-bold text-[9px] backdrop-blur-xs">
                    {imageList.length} images
                  </span>
                )}
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
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  Number(form.stock) > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {Number(form.stock) > 0 ? `In Stock · ${form.stock} available` : 'Unavailable'}
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
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 relative">
                      <img
                        src={
                          (Array.isArray(p.images) &&
                            (p.images.find((img) => img.isCover)?.url || p.images[0]?.url)) ||
                          p.imageUrl ||
                          p.image ||
                          '/packs/lays.jpg'
                        }
                        alt={p.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                        }}
                      />
                      {Array.isArray(p.images) && p.images.length > 1 && (
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-black/75 text-white text-[8px] font-bold rounded-full">
                          {p.images.length}
                        </span>
                      )}
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
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 relative">
                          <img
                            src={
                              (Array.isArray(p.images) &&
                                (p.images.find((img) => img.isCover)?.url || p.images[0]?.url)) ||
                              p.imageUrl ||
                              p.image ||
                              '/packs/lays.jpg'
                            }
                            alt={p.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                            }}
                          />
                          {Array.isArray(p.images) && p.images.length > 1 && (
                            <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-black/75 text-white text-[8px] font-bold rounded-full">
                              {p.images.length}
                            </span>
                          )}
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
