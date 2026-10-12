import mongoose from 'mongoose';

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
      required: [true, 'Image URL is required'],
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
        if (!ret.imageUrl && ret.image) ret.imageUrl = ret.image;
        if (!ret.image && ret.imageUrl) ret.image = ret.imageUrl;
        if (ret.isActive === undefined) ret.isActive = ret.isAvailable ?? true;
        if (ret.isAvailable === undefined) ret.isAvailable = ret.isActive ?? true;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        if (!ret.imageUrl && ret.image) ret.imageUrl = ret.image;
        if (!ret.image && ret.imageUrl) ret.image = ret.imageUrl;
        if (ret.isActive === undefined) ret.isActive = ret.isAvailable ?? true;
        if (ret.isAvailable === undefined) ret.isAvailable = ret.isActive ?? true;
        return ret;
      },
    },
  }
);

productSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  if (this.imageUrl && !this.image) {
    this.image = this.imageUrl;
  } else if (this.image && !this.imageUrl) {
    this.imageUrl = this.image;
  }
  if (this.isActive !== undefined && this.isAvailable === undefined) {
    this.isAvailable = this.isActive;
  } else if (this.isAvailable !== undefined && this.isActive === undefined) {
    this.isActive = this.isAvailable;
  }
  next();
});

productSchema.pre('save', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  if (this.imageUrl && !this.image) {
    this.image = this.imageUrl;
  } else if (this.image && !this.imageUrl) {
    this.imageUrl = this.image;
  }
  if (this.isActive !== undefined && this.isAvailable === undefined) {
    this.isAvailable = this.isActive;
  } else if (this.isAvailable !== undefined && this.isActive === undefined) {
    this.isActive = this.isAvailable;
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ slug: 1 });

export const Product = mongoose.model('Product', productSchema);

