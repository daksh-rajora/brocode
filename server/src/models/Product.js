import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    publicId: {
      type: String,
      default: null,
      trim: true,
    },
    isCover: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Snack name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    brand: {
      type: String,
      default: 'Bro Code',
      trim: true,
    },
    weight: {
      type: String,
      default: '50g',
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
      trim: true,
    },
    images: {
      type: [productImageSchema],
      default: [],
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 25,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    spiceLevel: {
      type: String,
      enum: ['none', 'mild', 'medium', 'fire'],
      default: 'none',
    },
    prepTimeMinutes: {
      type: Number,
      default: 5,
      min: 1,
    },
    tags: {
      type: [String],
      default: [],
    },
    hostelFavorite: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    reviewCount: {
      type: Number,
      default: 120,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (!Array.isArray(ret.images) || ret.images.length === 0) {
          if (ret.image || ret.imageUrl) {
            ret.images = [
              {
                url: ret.imageUrl || ret.image,
                publicId: ret.cloudinaryPublicId || null,
                isCover: true,
                order: 0,
              },
            ];
          } else {
            ret.images = [];
          }
        }
        const cover = ret.images.find((i) => i.isCover) || ret.images[0];
        if (cover) {
          if (!ret.image) ret.image = cover.url;
          if (!ret.imageUrl) ret.imageUrl = cover.url;
          if (!ret.cloudinaryPublicId && cover.publicId) ret.cloudinaryPublicId = cover.publicId;
        } else {
          if (!ret.imageUrl && ret.image) ret.imageUrl = ret.image;
          if (!ret.image && ret.imageUrl) ret.image = ret.imageUrl;
        }
        if (ret.isActive === undefined) ret.isActive = true;
        if (ret.stock !== undefined && ret.stock !== null) {
          ret.isAvailable = Number(ret.stock) > 0;
        } else if (ret.isAvailable === undefined) {
          ret.isAvailable = true;
        }
        if (ret.sellingPrice === undefined && ret.price !== undefined) ret.sellingPrice = ret.price;
        if (ret.selling_price === undefined && ret.price !== undefined) ret.selling_price = ret.price;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        if (!Array.isArray(ret.images) || ret.images.length === 0) {
          if (ret.image || ret.imageUrl) {
            ret.images = [
              {
                url: ret.imageUrl || ret.image,
                publicId: ret.cloudinaryPublicId || null,
                isCover: true,
                order: 0,
              },
            ];
          } else {
            ret.images = [];
          }
        }
        const cover = ret.images.find((i) => i.isCover) || ret.images[0];
        if (cover) {
          if (!ret.image) ret.image = cover.url;
          if (!ret.imageUrl) ret.imageUrl = cover.url;
          if (!ret.cloudinaryPublicId && cover.publicId) ret.cloudinaryPublicId = cover.publicId;
        } else {
          if (!ret.imageUrl && ret.image) ret.imageUrl = ret.image;
          if (!ret.image && ret.imageUrl) ret.image = ret.imageUrl;
        }
        if (ret.isActive === undefined) ret.isActive = true;
        if (ret.stock !== undefined && ret.stock !== null) {
          ret.isAvailable = Number(ret.stock) > 0;
        } else if (ret.isAvailable === undefined) {
          ret.isAvailable = true;
        }
        if (ret.sellingPrice === undefined && ret.price !== undefined) ret.sellingPrice = ret.price;
        if (ret.selling_price === undefined && ret.price !== undefined) ret.selling_price = ret.price;
        return ret;
      },
    },
  }
);

productSchema.virtual('sellingPrice')
  .get(function () {
    return this.price;
  })
  .set(function (val) {
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      this.price = Number(val);
    }
  });

productSchema.virtual('selling_price')
  .get(function () {
    return this.price;
  })
  .set(function (val) {
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      this.price = Number(val);
    }
  });

function syncProductImages(doc) {
  if (Array.isArray(doc.images) && doc.images.length > 0) {
    doc.images = doc.images
      .map((img, idx) => {
        if (typeof img === 'string') {
          return { url: img, publicId: null, isCover: idx === 0, order: idx };
        }
        return {
          url: img.url || img.imageUrl || img.image,
          publicId: img.publicId || img.cloudinaryPublicId || null,
          isCover: Boolean(img.isCover),
          order: img.order !== undefined && !isNaN(Number(img.order)) ? Number(img.order) : idx,
        };
      })
      .filter((img) => Boolean(img.url));

    doc.images.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const hasCover = doc.images.some((img) => img.isCover);
    if (!hasCover && doc.images.length > 0) {
      doc.images[0].isCover = true;
    }

    const cover = doc.images.find((img) => img.isCover) || doc.images[0];
    if (cover) {
      doc.image = cover.url;
      doc.imageUrl = cover.url;
      if (cover.publicId) {
        doc.cloudinaryPublicId = cover.publicId;
      }
    }
  } else if (doc.imageUrl || doc.image) {
    const singleUrl = doc.imageUrl || doc.image;
    doc.images = [
      {
        url: singleUrl,
        publicId: doc.cloudinaryPublicId || null,
        isCover: true,
        order: 0,
      },
    ];
    if (!doc.image) doc.image = singleUrl;
    if (!doc.imageUrl) doc.imageUrl = singleUrl;
  }
}

productSchema.pre('validate', function (next) {
  if (this.price === undefined || this.price === null || isNaN(this.price)) {
    const fallback =
      this.sellingPrice ??
      this.selling_price ??
      (this.get ? this.get('sellingPrice') : undefined) ??
      (this.get ? this.get('selling_price') : undefined);
    if (fallback !== undefined && fallback !== null && !isNaN(Number(fallback))) {
      this.price = Number(fallback);
    }
  }
  if (this.stock !== undefined && this.stock !== null && !isNaN(Number(this.stock))) {
    this.stock = Math.max(0, parseInt(this.stock, 10) || 0);
    this.isAvailable = this.stock > 0;
  }
  if (this.isActive === undefined) {
    this.isActive = true;
  }
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  syncProductImages(this);
  if (!this.image && (!this.images || this.images.length === 0)) {
    this.invalidate('image', 'Image URL is required');
  }
  next();
});

productSchema.pre('save', function (next) {
  if (this.price === undefined || this.price === null || isNaN(this.price)) {
    const fallback =
      this.sellingPrice ??
      this.selling_price ??
      (this.get ? this.get('sellingPrice') : undefined) ??
      (this.get ? this.get('selling_price') : undefined);
    if (fallback !== undefined && fallback !== null && !isNaN(Number(fallback))) {
      this.price = Number(fallback);
    }
  }
  if (this.stock !== undefined && this.stock !== null && !isNaN(Number(this.stock))) {
    this.stock = Math.max(0, parseInt(this.stock, 10) || 0);
    this.isAvailable = this.stock > 0;
  }
  if (this.isActive === undefined) {
    this.isActive = true;
  }
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  syncProductImages(this);
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isAvailable: 1, stock: 1 });
productSchema.index({ slug: 1 });

export const Product = mongoose.model('Product', productSchema);

