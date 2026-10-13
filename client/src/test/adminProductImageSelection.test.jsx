import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { apiService } from '../services/api';

const mockExistingProduct = {
  _id: 'prod-existing-101',
  name: 'Midnight Dark Chocolate Bar',
  price: 80,
  sellingPrice: 80,
  stock: 35,
  brand: 'Cadbury',
  weight: '50g',
  description: 'Rich dark chocolate for late night cravings.',
  image: 'https://images.unsplash.com/photo-existing-chocolate-1.jpg',
  imageUrl: 'https://images.unsplash.com/photo-existing-chocolate-1.jpg',
  images: [
    {
      _id: 'img-1',
      url: 'https://images.unsplash.com/photo-existing-chocolate-1.jpg',
      isCover: true,
      order: 0,
    },
    {
      _id: 'img-2',
      url: 'https://images.unsplash.com/photo-existing-chocolate-2.jpg',
      isCover: false,
      order: 1,
    },
  ],
  isActive: true,
  isAvailable: true,
};

describe('Admin Portal — Add New Product Image Selection & Workflow Isolation Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiService, 'getProducts').mockResolvedValue({
      data: [mockExistingProduct],
    });
  });

  describe('Workflow 1: Add New Product (Initial Empty State & Explicit Selection)', () => {
    it('should initialize selected product images array as EMPTY on page load with action=new', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/products?action=new']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // 1. Image count badge must show "0 images" (NOT 1 image or Lay's)
      const countBadge = screen.getByTestId('admin-image-count-badge');
      expect(countBadge).toHaveTextContent('0 images');

      // 2. Dropzone placeholder must be displayed prominently with "Add Images"
      expect(screen.getByTestId('image-dropzone')).toBeInTheDocument();
      expect(screen.getByText(/Add Images — Click to upload/i)).toBeInTheDocument();

      // 3. Product preview must show "No Image Selected" placeholder (NOT Lay's or fallback image)
      expect(screen.getByTestId('product-preview-empty-placeholder')).toBeInTheDocument();
      expect(screen.getByText('No Image Selected')).toBeInTheDocument();
      expect(screen.queryByTestId('product-preview-cover-img')).not.toBeInTheDocument();

      // 4. Preview title must not leak Lay's
      expect(screen.queryByText("Lay's Classic Salted (52g)")).not.toBeInTheDocument();

      // 5. Save Product button must be disabled when image list is empty
      const saveBtn = screen.getByRole('button', { name: /Save Product/i });
      expect(saveBtn).toBeDisabled();

      // 6. Validation notice should be displayed
      expect(screen.getByTestId('no-image-validation-notice')).toHaveTextContent(
        'At least one product image is required to save.'
      );
    });

    it('selecting a quick snack preset thumbnail must be an explicit action and sets it as Cover', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/products?action=new']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Verify no image selected before clicking preset
      expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('0 images');

      // Find quick preset button (e.g. Maggi Noodles preset)
      const maggiPresetBtn = screen.getByTitle('Add Maggi Noodles');
      expect(maggiPresetBtn).toBeInTheDocument();

      // Click the preset explicitly
      fireEvent.click(maggiPresetBtn);

      // Now image count becomes 1
      expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('1 image');

      // The added image must automatically become Cover
      expect(screen.getByText('Cover')).toBeInTheDocument();

      // Preview now displays the cover image
      expect(screen.getByTestId('product-preview-cover-img')).toBeInTheDocument();
      expect(screen.queryByTestId('product-preview-empty-placeholder')).not.toBeInTheDocument();
    });

    it('uploading or adding an image via URL marks the first image as Cover automatically and enables Save', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/products?action=new']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Fill name and price
      const nameInput = screen.getByPlaceholderText('e.g. Maggi 2-Minute Masala Noodles');
      fireEvent.change(nameInput, { target: { value: 'Peri Peri Makhana' } });
      const priceInput = screen.getByPlaceholderText('e.g. 20');
      fireEvent.change(priceInput, { target: { value: '45' } });

      // Save button remains disabled because imageList is 0
      const saveBtn = screen.getByRole('button', { name: /Save Product/i });
      expect(saveBtn).toBeDisabled();

      // Add direct image URL
      const urlInput = screen.getByPlaceholderText('Or paste direct image URL (https://...)');
      const addUrlBtn = screen.getByTestId('add-image-url-btn');
      fireEvent.change(urlInput, { target: { value: 'https://images.unsplash.com/makhana.jpg' } });
      fireEvent.click(addUrlBtn);

      // Count is now 1 image
      expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('1 image');

      // Image has Cover badge
      expect(screen.getByText('Cover')).toBeInTheDocument();

      // Preview displays the cover image
      const previewImg = screen.getByTestId('product-preview-cover-img');
      expect(previewImg).toHaveAttribute('src', 'https://images.unsplash.com/makhana.jpg');

      // Save Product button is now enabled
      expect(saveBtn).not.toBeDisabled();
    });
  });

  describe('Workflow 2: Edit Existing Product (Preserves Actual Saved Images)', () => {
    it('when editing an existing product, it loads and preserves that product saved images and cover', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/products']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Midnight Dark Chocolate Bar').length).toBeGreaterThan(0);
      });

      // Click Edit on the existing product
      const editBtns = screen.getAllByTitle('Edit Product');
      fireEvent.click(editBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Product')).toBeInTheDocument();
      });

      // Must preserve existing product's 2 images
      expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('2 images');

      // Dropzone empty state must NOT be shown
      expect(screen.queryByTestId('image-dropzone')).not.toBeInTheDocument();

      // Preview must display the existing product's cover image
      const previewImg = screen.getByTestId('product-preview-cover-img');
      expect(previewImg).toHaveAttribute(
        'src',
        'https://images.unsplash.com/photo-existing-chocolate-1.jpg'
      );
      expect(screen.queryByTestId('product-preview-empty-placeholder')).not.toBeInTheDocument();

      // Title in preview shows existing product name
      expect(screen.getAllByText('Midnight Dark Chocolate Bar').length).toBeGreaterThan(0);
    });

    it('resetting from edit mode to Add New Product cleanly empties image state without leaking images', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/products']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Midnight Dark Chocolate Bar').length).toBeGreaterThan(0);
      });

      // 1. Edit existing product
      const editBtns = screen.getAllByTitle('Edit Product');
      fireEvent.click(editBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Product')).toBeInTheDocument();
      });
      expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('2 images');

      // 2. Click Back to Products
      const backBtn = screen.getByRole('button', { name: /Back to Products/i });
      fireEvent.click(backBtn);

      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument();
      });

      // 3. Click "+ Add Product"
      const addProductBtn = screen.getByRole('button', { name: /Add Product/i });
      fireEvent.click(addProductBtn);

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // 4. Must be completely clean: 0 images, empty placeholder, no leaked chocolate or Lay's images
      expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('0 images');
      expect(screen.getByTestId('product-preview-empty-placeholder')).toBeInTheDocument();
      expect(screen.queryByTestId('product-preview-cover-img')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Product/i })).toBeDisabled();
    });
  });
});
