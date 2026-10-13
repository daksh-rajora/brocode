import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider, CartContext } from '../context/CartContext';
import { SnackCard } from '../components/SnackCard';
import { SnackModal } from '../components/SnackModal';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { apiService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const mockSnack = {
  _id: 'snack-1234567890',
  name: 'Midnight Butter Maggi',
  description: 'Double noodles with melted butter and classic tastemaker',
  price: 60,
  category: 'noodles',
  image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500',
  stock: 15,
  isAvailable: true,
  isVeg: true,
  hostelFavorite: true,
  rating: 4.9,
};

describe('Bro Code Frontend Component Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Formatters Utility', () => {
    it('should format numbers into Indian Rupee currency correctly', () => {
      expect(formatCurrency(60)).toBe('₹60');
      expect(formatCurrency(1250)).toBe('₹1,250');
      expect(formatCurrency(null)).toBe('₹0');
      expect(formatCurrency(undefined)).toBe('₹0');
      expect(formatCurrency('')).toBe('₹0');
      expect(formatCurrency(0)).toBe('₹0');
    });

    it('should format string representations of numbers into ₹ currency correctly', () => {
      expect(formatCurrency('25')).toBe('₹25');
      expect(formatCurrency(25)).toBe('₹25');
      expect(formatCurrency('0')).toBe('₹0');
      expect(formatCurrency('invalid')).toBe('₹0');
    });

    it('should format date strings safely', () => {
      const formatted = formatDate('2026-10-12T02:30:00Z');
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('Automatic Stock Availability & Badges', () => {
    it('Scenario 1: Stock = 10 → displays "In Stock · 10 available"', () => {
      const snack10 = { ...mockSnack, stock: 10, isAvailable: true };
      render(
        <CartProvider>
          <SnackCard snack={snack10} />
        </CartProvider>
      );
      const badge = screen.getByTestId('stock-badge');
      expect(badge).toHaveTextContent('In Stock · 10 available');
      expect(screen.getByText('Add')).toBeEnabled();
    });

    it('Scenario 3 & 5: Stock = 0 → displays "Unavailable" badge and disables purchasing', () => {
      const outOfStockSnack = { ...mockSnack, stock: 0, isAvailable: false };
      render(
        <CartProvider>
          <SnackCard snack={outOfStockSnack} />
        </CartProvider>
      );
      const badge = screen.getByTestId('stock-badge');
      expect(badge).toHaveTextContent('Unavailable');
      const button = screen.getByRole('button', { name: /Unavailable/i });
      expect(button).toBeDisabled();
    });

    it('Scenario 4: Stock = 15 → displays "In Stock · 15 available"', () => {
      const snack15 = { ...mockSnack, stock: 15, isAvailable: true };
      render(
        <CartProvider>
          <SnackCard snack={snack15} />
        </CartProvider>
      );
      const badge = screen.getByTestId('stock-badge');
      expect(badge).toHaveTextContent('In Stock · 15 available');
    });

    it('SnackModal should display "In Stock · 15 available" when stock is 15, and "Unavailable" when stock is 0', () => {
      const snack15 = { ...mockSnack, stock: 15, isAvailable: true };
      const { unmount } = render(
        <CartProvider>
          <SnackModal snack={snack15} onClose={() => {}} />
        </CartProvider>
      );
      expect(screen.getByTestId('modal-stock-badge')).toHaveTextContent('In Stock · 15 available');
      unmount();

      const snack0 = { ...mockSnack, stock: 0, isAvailable: false };
      render(
        <CartProvider>
          <SnackModal snack={snack0} onClose={() => {}} />
        </CartProvider>
      );
      expect(screen.getByTestId('modal-stock-badge')).toHaveTextContent('Unavailable');
      expect(screen.getByRole('button', { name: /Unavailable/i })).toBeDisabled();
    });
  });

  describe('SnackCard Component & Cart Integration', () => {
    it('should render snack title, price, bestseller badge, and add button', () => {
      render(
        <CartProvider>
          <SnackCard snack={mockSnack} />
        </CartProvider>
      );

      expect(screen.getByText('Midnight Butter Maggi')).toBeInTheDocument();
      expect(screen.getByText('₹60')).toBeInTheDocument();
      expect(screen.getByText('Bestseller')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('should correctly display selling price of ₹25 across price, sellingPrice, and selling_price properties', () => {
      const snackWithPrice25 = { ...mockSnack, _id: 's-25-1', price: 25 };
      const { unmount: unmount1 } = render(
        <CartProvider>
          <SnackCard snack={snackWithPrice25} />
        </CartProvider>
      );
      expect(screen.getByText('₹25')).toBeInTheDocument();
      unmount1();

      const snackWithSellingPrice25 = {
        ...mockSnack,
        _id: 's-25-2',
        price: undefined,
        sellingPrice: 25,
      };
      const { unmount: unmount2 } = render(
        <CartProvider>
          <SnackCard snack={snackWithSellingPrice25} />
        </CartProvider>
      );
      expect(screen.getByText('₹25')).toBeInTheDocument();
      unmount2();

      const snackWithSnakeSellingPrice = {
        ...mockSnack,
        _id: 's-25-3',
        price: undefined,
        selling_price: 25,
      };
      render(
        <CartProvider>
          <SnackCard snack={snackWithSnakeSellingPrice} />
        </CartProvider>
      );
      expect(screen.getByText('₹25')).toBeInTheDocument();
    });

    it('should update cart when Add button is clicked', () => {
      const TestConsumer = () => {
        const { totalItems } = React.useContext(CartContext);
        return (
          <div>
            <span data-testid="cart-count">{totalItems}</span>
            <SnackCard snack={mockSnack} />
          </div>
        );
      };

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      expect(screen.getByTestId('cart-count').textContent).toBe('0');
      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });
  });

  describe('SnackModal Component Pricing Display', () => {
    it('should display ₹25 and calculated cart total for product priced at 25', () => {
      const snack25 = { ...mockSnack, price: 25, name: 'Potato Chips 25' };
      render(
        <CartProvider>
          <SnackModal snack={snack25} onClose={() => {}} />
        </CartProvider>
      );

      expect(screen.getByText('₹25')).toBeInTheDocument();
      expect(screen.getByText(/Add to Cart • ₹25/i)).toBeInTheDocument();
    });
  });

  describe('Admin Panel Add Product: Submission and Live Price Preview', () => {
    it('should immediately update the Product Preview from ₹0 to ₹25 when typing Selling Price', async () => {
      vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [] });

      render(
        <MemoryRouter initialEntries={['/admin/products?action=new']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      const previewPriceEl = screen.getByTestId('product-preview-price');
      expect(previewPriceEl).toHaveTextContent('₹0');

      const priceInput = screen.getByPlaceholderText('e.g. 20');
      fireEvent.change(priceInput, { target: { value: '25' } });

      expect(previewPriceEl).toHaveTextContent('₹25');

      fireEvent.change(priceInput, { target: { value: '99' } });
      expect(previewPriceEl).toHaveTextContent('₹99');

      fireEvent.change(priceInput, { target: { value: '' } });
      expect(previewPriceEl).toHaveTextContent('₹0');
    });

    it('should submit product details, invoke createProduct API, and return to products list', async () => {
      const createdProduct = {
        _id: 'new-prod-999',
        name: 'Kurkure Masala Munch 25',
        price: 25,
        sellingPrice: 25,
        stock: 25,
        brand: 'Kurkure',
        image: '/packs/lays.jpg',
        imageUrl: '/packs/lays.jpg',
        isActive: true,
        isAvailable: true,
      };

      vi.spyOn(apiService, 'createProduct').mockResolvedValue({ success: true, data: createdProduct });
      vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [createdProduct] });

      render(
        <MemoryRouter initialEntries={['/admin/products?action=new']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('e.g. Maggi 2-Minute Masala Noodles');
      fireEvent.change(nameInput, { target: { value: 'Kurkure Masala Munch 25' } });

      const priceInput = screen.getByPlaceholderText('e.g. 20');
      fireEvent.change(priceInput, { target: { value: '25' } });

      // Add a product image
      const urlInput = screen.getByPlaceholderText('Or paste direct image URL (https://...)');
      const addUrlBtn = screen.getByTestId('add-image-url-btn');
      fireEvent.change(urlInput, { target: { value: '/packs/lays.jpg' } });
      fireEvent.click(addUrlBtn);

      const submitBtn = screen.getByRole('button', { name: /Save Product/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(apiService.createProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Kurkure Masala Munch 25',
            price: 25,
            sellingPrice: 25,
            stock: 25,
          })
        );
      });
    });
  });

  describe('Dynamic Admin-Configurable Delivery Charges', () => {
    describe('Admin Settings Page — Delivery Configuration', () => {
      it('should load and display currently saved delivery charge and allow updating to ₹20', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: {
            storeName: 'Bro Code',
            deliveryFee: 10,
            freeDeliveryAbove: 150,
            minOrderAmount: 0,
            isOpen: true,
          },
        });
        vi.spyOn(apiService, 'updateSettings').mockResolvedValue({
          success: true,
          data: { deliveryFee: 20 },
        });

        render(
          <MemoryRouter>
            <AdminSettingsPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('current-delivery-charge-display')).toHaveTextContent('₹10');
        });

        const input = screen.getByTestId('delivery-charge-input');
        expect(input).toHaveValue(10);

        // Change to ₹20
        fireEvent.change(input, { target: { value: '20' } });
        expect(input).toHaveValue(20);

        const saveBtn = screen.getByTestId('save-delivery-charge-btn');
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(apiService.updateSettings).toHaveBeenCalledWith(
            expect.objectContaining({
              deliveryFee: 20,
            })
          );
        });
      });

      it('should allow setting delivery charge to ₹0 for Free Delivery', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: {
            deliveryFee: 15,
            isOpen: true,
          },
        });
        vi.spyOn(apiService, 'updateSettings').mockResolvedValue({
          success: true,
          data: { deliveryFee: 0 },
        });

        render(
          <MemoryRouter>
            <AdminSettingsPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('current-delivery-charge-display')).toHaveTextContent('₹15');
        });

        const input = screen.getByTestId('delivery-charge-input');
        fireEvent.change(input, { target: { value: '0' } });

        const saveBtn = screen.getByTestId('save-delivery-charge-btn');
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(apiService.updateSettings).toHaveBeenCalledWith(
            expect.objectContaining({
              deliveryFee: 0,
            })
          );
        });
      });

      it('should reject negative delivery charge values and prevent submission', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { deliveryFee: 10 },
        });
        const updateSpy = vi.spyOn(apiService, 'updateSettings');

        render(
          <MemoryRouter>
            <AdminSettingsPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('delivery-charge-input')).toBeInTheDocument();
        });

        const input = screen.getByTestId('delivery-charge-input');
        fireEvent.change(input, { target: { value: '-10' } });

        expect(screen.getByTestId('delivery-charge-error')).toHaveTextContent(
          /Delivery charge cannot be negative/i
        );

        const saveBtn = screen.getByTestId('save-delivery-charge-btn');
        expect(saveBtn).toBeDisabled();
        expect(updateSpy).not.toHaveBeenCalled();
      });
    });

    describe('Customer Cart & Checkout Delivery Calculation', () => {
      beforeEach(() => {
        localStorage.clear();
      });

      it('Cart Page: calculates and displays delivery charge of ₹10, subtotal ₹120, and total ₹130', async () => {
        localStorage.setItem(
          'brocode_cart_v1',
          JSON.stringify([{ product: mockSnack, quantity: 2 }])
        );
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { deliveryFee: 10, isOpen: true },
        });
        vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [mockSnack] });

        render(
          <MemoryRouter>
            <CartProvider>
              <CartPage />
            </CartProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('₹120');
        });

        expect(screen.getByTestId('cart-delivery-charge')).toHaveTextContent('₹10');
        expect(screen.getByTestId('cart-total-amount')).toHaveTextContent('₹130');
      });

      it('Cart Page: updates to ₹20 delivery fee (Total = ₹140) when backend settings return 20', async () => {
        localStorage.setItem(
          'brocode_cart_v1',
          JSON.stringify([{ product: mockSnack, quantity: 2 }])
        );
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { deliveryFee: 20, isOpen: true },
        });
        vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [mockSnack] });

        render(
          <MemoryRouter>
            <CartProvider>
              <CartPage />
            </CartProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('cart-delivery-charge')).toHaveTextContent('₹20');
        });

        expect(screen.getByTestId('cart-total-amount')).toHaveTextContent('₹140');
      });

      it('Cart Page: displays FREE (₹0) delivery fee and Total = ₹120 when backend settings return 0', async () => {
        localStorage.setItem(
          'brocode_cart_v1',
          JSON.stringify([{ product: mockSnack, quantity: 2 }])
        );
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { deliveryFee: 0, isOpen: true },
        });
        vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [mockSnack] });

        render(
          <MemoryRouter>
            <CartProvider>
              <CartPage />
            </CartProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('cart-delivery-charge')).toHaveTextContent('FREE (₹0)');
        });

        expect(screen.getByTestId('cart-total-amount')).toHaveTextContent('₹120');
      });

      it('Checkout Page: displays Room Delivery fee of ₹20, subtotal ₹120, and total ₹140', async () => {
        localStorage.setItem(
          'brocode_cart_v1',
          JSON.stringify([{ product: mockSnack, quantity: 2 }])
        );
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { deliveryFee: 20, isOpen: true, minOrderAmount: 0 },
        });

        render(
          <MemoryRouter>
            <CartProvider>
              <CheckoutPage />
            </CartProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('checkout-subtotal')).toHaveTextContent('₹120');
        });

        expect(screen.getByTestId('checkout-delivery-charge')).toHaveTextContent('₹20');
        expect(screen.getByTestId('checkout-total-amount')).toHaveTextContent('₹140');
        expect(screen.getByTestId('room-delivery-fee-badge')).toHaveTextContent('+₹20 fee');
      });

      it('Checkout Page: switches to FREE (₹0) delivery fee when Self Pickup is selected', async () => {
        localStorage.setItem(
          'brocode_cart_v1',
          JSON.stringify([{ product: mockSnack, quantity: 2 }])
        );
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { deliveryFee: 20, isOpen: true, minOrderAmount: 0 },
        });

        render(
          <MemoryRouter>
            <CartProvider>
              <CheckoutPage />
            </CartProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('checkout-delivery-charge')).toHaveTextContent('₹20');
        });

        // Click Self Pickup button
        const pickupBtn = screen.getByRole('button', { name: /Self Pickup/i });
        fireEvent.click(pickupBtn);

        expect(screen.getByTestId('checkout-delivery-charge')).toHaveTextContent('FREE (₹0)');
        expect(screen.getByTestId('checkout-total-amount')).toHaveTextContent('₹120');
      });
    });
  });

  describe('Multiple Product Images — Admin & Customer Gallery Suite', () => {
    const multiImageSnack = {
      ...mockSnack,
      _id: 'snack-multi-img',
      name: 'Triple Flavor Popcorn Box',
      images: [
        { url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400', isCover: true, order: 0 },
        { url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400', isCover: false, order: 1 },
        { url: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400', isCover: false, order: 2 },
      ],
    };

    describe('Admin Multiple Product Image Management', () => {
      it('should allow adding images via direct URL, changing cover image, and updating live preview', async () => {
        vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [] });

        render(
          <MemoryRouter initialEntries={['/admin/products?action=new']}>
            <AdminProductsPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Add New Product')).toBeInTheDocument();
        });

        // Initially has no images selected (0 images)
        expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('0 images');

        // Add first image via URL
        const urlInput = screen.getByPlaceholderText('Or paste direct image URL (https://...)');
        const addUrlBtn = screen.getByTestId('add-image-url-btn');

        fireEvent.change(urlInput, {
          target: { value: 'https://images.unsplash.com/photo-popcorn-angle1.jpg' },
        });
        fireEvent.click(addUrlBtn);

        // First added image becomes cover automatically
        expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('1 image');

        // Add a second image via URL
        fireEvent.change(urlInput, {
          target: { value: 'https://images.unsplash.com/photo-popcorn-angle2.jpg' },
        });
        fireEvent.click(addUrlBtn);

        // Now has 2 images
        expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('2 images');

        // The second image has a "Set as Cover" button
        const setCoverBtn1 = screen.getByTestId('set-cover-btn-1');
        fireEvent.click(setCoverBtn1);

        // Preview should now show the new cover and image count
        expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('2 images');
      });

      it('should allow reordering and removing images in the admin form', async () => {
        vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [] });

        render(
          <MemoryRouter initialEntries={['/admin/products?action=new']}>
            <AdminProductsPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Add New Product')).toBeInTheDocument();
        });

        // Add 3 images via URL
        const urlInput = screen.getByPlaceholderText('Or paste direct image URL (https://...)');
        const addUrlBtn = screen.getByTestId('add-image-url-btn');

        fireEvent.change(urlInput, { target: { value: 'https://image-1.jpg' } });
        fireEvent.click(addUrlBtn);

        fireEvent.change(urlInput, { target: { value: 'https://image-2.jpg' } });
        fireEvent.click(addUrlBtn);

        fireEvent.change(urlInput, { target: { value: 'https://image-3.jpg' } });
        fireEvent.click(addUrlBtn);

        expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('3 images');

        // Move image 0 to the right
        const moveRightBtn0 = screen.getByTestId('move-image-right-0');
        fireEvent.click(moveRightBtn0);

        // Remove image at index 2
        const removeBtn2 = screen.getByTestId('remove-image-btn-2');
        fireEvent.click(removeBtn2);

        expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('2 images');
      });

      it('should submit product with multiple images payload structure', async () => {
        const createSpy = vi.spyOn(apiService, 'createProduct').mockResolvedValue({
          success: true,
          data: multiImageSnack,
        });
        vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [multiImageSnack] });

        render(
          <MemoryRouter initialEntries={['/admin/products?action=new']}>
            <AdminProductsPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Add New Product')).toBeInTheDocument();
        });

        const nameInput = screen.getByPlaceholderText('e.g. Maggi 2-Minute Masala Noodles');
        fireEvent.change(nameInput, { target: { value: 'Triple Flavor Popcorn Box' } });

        const priceInput = screen.getByPlaceholderText('e.g. 20');
        fireEvent.change(priceInput, { target: { value: '60' } });

        // Add extra image
        const urlInput = screen.getByPlaceholderText('Or paste direct image URL (https://...)');
        const addUrlBtn = screen.getByTestId('add-image-url-btn');
        fireEvent.change(urlInput, { target: { value: 'https://image-back.jpg' } });
        fireEvent.click(addUrlBtn);

        const submitBtn = screen.getByRole('button', { name: /Save Product/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          expect(createSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'Triple Flavor Popcorn Box',
              images: expect.arrayContaining([
                expect.objectContaining({ url: expect.any(String), isCover: true, order: 0 }),
              ]),
            })
          );
        });
      });
    });

    describe('Customer Product Image Gallery (SnackModal)', () => {
      it('single-image product: displays image and hides navigation controls', () => {
        const singleSnack = { ...mockSnack, images: [{ url: 'https://single-img.jpg', isCover: true }] };
        render(
          <CartProvider>
            <SnackModal snack={singleSnack} onClose={() => {}} />
          </CartProvider>
        );

        const mainImg = screen.getByTestId('gallery-main-img');
        expect(mainImg).toHaveAttribute('src', 'https://single-img.jpg');

        expect(screen.queryByTestId('gallery-prev-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('gallery-next-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('gallery-counter')).not.toBeInTheDocument();
        expect(screen.queryByTestId('gallery-thumbnails')).not.toBeInTheDocument();
      });

      it('multi-image product: displays counter "1 / 3", arrows, and clickable thumbnails', () => {
        render(
          <CartProvider>
            <SnackModal snack={multiImageSnack} onClose={() => {}} />
          </CartProvider>
        );

        expect(screen.getByTestId('gallery-counter')).toHaveTextContent('1 / 3');
        expect(screen.getByTestId('gallery-prev-btn')).toBeInTheDocument();
        expect(screen.getByTestId('gallery-next-btn')).toBeInTheDocument();
        expect(screen.getByTestId('gallery-thumbnails')).toBeInTheDocument();

        // Click next arrow
        const nextBtn = screen.getByTestId('gallery-next-btn');
        fireEvent.click(nextBtn);

        expect(screen.getByTestId('gallery-counter')).toHaveTextContent('2 / 3');

        // Click thumbnail 2
        const thumb2 = screen.getByTestId('gallery-thumb-2');
        fireEvent.click(thumb2);

        expect(screen.getByTestId('gallery-counter')).toHaveTextContent('3 / 3');
        const mainImg = screen.getByTestId('gallery-main-img');
        expect(mainImg).toHaveAttribute('src', multiImageSnack.images[2].url);
      });

      it('multi-image product: supports touch swipe navigation without interfering with scrolling', () => {
        render(
          <CartProvider>
            <SnackModal snack={multiImageSnack} onClose={() => {}} />
          </CartProvider>
        );

        expect(screen.getByTestId('gallery-counter')).toHaveTextContent('1 / 3');

        const mainImg = screen.getByTestId('gallery-main-img');

        // Simulate swipe left (next image)
        fireEvent.touchStart(mainImg, {
          touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchEnd(mainImg, {
          changedTouches: [{ clientX: 150, clientY: 105 }],
        });

        expect(screen.getByTestId('gallery-counter')).toHaveTextContent('2 / 3');

        // Simulate swipe right (previous image)
        fireEvent.touchStart(mainImg, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(mainImg, {
          changedTouches: [{ clientX: 200, clientY: 98 }],
        });

        expect(screen.getByTestId('gallery-counter')).toHaveTextContent('1 / 3');
      });
    });

    describe('SnackCard Multi-Image Cover Display', () => {
      it('should display the primary cover image on the storefront product card', () => {
        render(
          <CartProvider>
            <SnackCard snack={multiImageSnack} />
          </CartProvider>
        );

        const cardImg = screen.getByAltText('Triple Flavor Popcorn Box');
        expect(cardImg).toHaveAttribute('src', multiImageSnack.images[0].url);
      });
    });

    describe('UPI QR Payment Checkout Flow', () => {
      const renderCheckoutWithItem = (customDeliveryInfo = {}) => {
        const customContextValue = {
          items: [{ product: mockSnack, quantity: 2 }],
          subtotal: 120,
          totalItems: 2,
          deliveryInfo: {
            studentName: 'Daksh Rajora',
            studentPhone: '9876543210',
            hostelBlock: 'BH1',
            roomNumber: '306',
            deliveryNotes: '',
            paymentMethod: 'upi',
            ...customDeliveryInfo,
          },
          updateDeliveryInfo: vi.fn(),
          clearCart: vi.fn(),
        };

        return render(
          <CartContext.Provider value={customContextValue}>
            <MemoryRouter initialEntries={['/checkout']}>
              <CheckoutPage />
            </MemoryRouter>
          </CartContext.Provider>
        );
      };

      it('should display "UPI" and "Cash on Delivery" as payment options (not "UPI on Delivery")', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { isOpen: true, deliveryFee: 15, minOrderAmount: 20 },
        });

        renderCheckoutWithItem();

        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText('Cash on Delivery')).toBeInTheDocument();
        expect(screen.getByText('UPI')).toBeInTheDocument();
        expect(screen.queryByText('UPI on Delivery')).not.toBeInTheDocument();
      });

      it('should display the QR code with verified details and instructions when UPI is selected', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { isOpen: true, deliveryFee: 15, minOrderAmount: 20 },
        });

        renderCheckoutWithItem({ paymentMethod: 'upi' });

        // QR section should be visible
        expect(screen.getByTestId('upi-qr-section')).toBeInTheDocument();

        // QR image should be present with proper attributes
        const qrImg = screen.getByTestId('upi-qr-image');
        expect(qrImg).toBeInTheDocument();
        expect(qrImg).toHaveAttribute('alt', 'UPI QR Code - Bro Code');

        // Instructions
        expect(
          screen.getByText(/Scan this QR code with any UPI app and complete the payment/i)
        ).toBeInTheDocument();

        // Verified Recipient details
        expect(screen.getByTestId('upi-recipient-name')).toHaveTextContent('Dheeraj');
        expect(screen.getByTestId('upi-id-display')).toHaveTextContent('dheerajbhardwaj621@oksbi');

        // Confirmation checkbox with dynamic order total
        expect(screen.getByTestId('upi-payment-confirm-checkbox')).toBeInTheDocument();
        expect(screen.getByText(/I have completed the UPI payment of/i)).toBeInTheDocument();

        // Pending Verification Process notice removed from Checkout UI
        expect(screen.queryByText(/Pending Verification Process/i)).not.toBeInTheDocument();

        // Button text is simply Confirm Order
        expect(
          screen.getByRole('button', { name: /Confirm Order/i })
        ).toBeInTheDocument();
      });

      it('should hide the QR code section when Cash on Delivery is selected', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { isOpen: true, deliveryFee: 15, minOrderAmount: 0 },
        });

        renderCheckoutWithItem({ paymentMethod: 'cash_on_delivery' });

        // QR section should NOT be in the document
        expect(screen.queryByTestId('upi-qr-section')).not.toBeInTheDocument();
        expect(screen.queryByTestId('upi-payment-confirm-checkbox')).not.toBeInTheDocument();

        // Confirm button for COD
        expect(screen.getByRole('button', { name: /Confirm Order/i })).toBeInTheDocument();
      });

      it('should prevent submission of UPI orders if customer has not checked the payment confirmation', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { isOpen: true, deliveryFee: 15, minOrderAmount: 0 },
        });
        const createOrderSpy = vi.spyOn(apiService, 'createOrder');

        renderCheckoutWithItem({ paymentMethod: 'upi' });

        const submitBtn = screen.getByRole('button', {
          name: /Confirm Order/i,
        });

        // Submit without checking the confirmation checkbox
        fireEvent.click(submitBtn);

        // API should NOT be called
        expect(createOrderSpy).not.toHaveBeenCalled();
      });

      it('should submit UPI order when customer confirms payment', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { isOpen: true, deliveryFee: 15, minOrderAmount: 0 },
        });
        const createOrderSpy = vi.spyOn(apiService, 'createOrder').mockResolvedValue({
          data: {
            _id: 'order-123',
            orderNumber: 'BRO-261013-TEST',
            paymentMethod: 'upi',
            paymentStatus: 'pending_verification',
          },
        });

        renderCheckoutWithItem({ paymentMethod: 'upi' });

        // Check the confirmation checkbox
        const confirmCheckbox = screen.getByTestId('upi-payment-confirm-checkbox');
        fireEvent.click(confirmCheckbox);

        // Submit order
        const submitBtn = screen.getByRole('button', {
          name: /Confirm Order/i,
        });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          expect(createOrderSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              paymentMethod: 'upi',
              studentName: 'Daksh Rajora',
              studentPhone: '9876543210',
              hostelBlock: 'BH1',
              roomNumber: '306',
              customerConfirmedPayment: true,
            })
          );
        });
      });

      it('should allow checkout for orders of any positive amount like ₹12 and ₹32 without minimum restriction', async () => {
        vi.spyOn(apiService, 'getSettings').mockResolvedValue({
          data: { isOpen: true, deliveryFee: 0, minOrderAmount: 0 },
        });
        const createOrderSpy = vi.spyOn(apiService, 'createOrder').mockResolvedValue({
          data: {
            _id: 'order-low-1',
            orderNumber: 'BRO-261013-LOW',
            totalAmount: 12,
            paymentMethod: 'cash_on_delivery',
          },
        });

        // Render with item worth ₹12
        renderCheckoutWithItem({
          items: [{ product: { _id: 'prod-12', name: 'Choco Stick', price: 12, stock: 10, isAvailable: true }, quantity: 1 }],
          paymentMethod: 'cash_on_delivery',
        });

        const submitBtn = screen.getByRole('button', { name: /Confirm Order/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          expect(createOrderSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              paymentMethod: 'cash_on_delivery',
              studentName: 'Daksh Rajora',
            })
          );
        });
      });
    });

    describe('Admin Orders Portal: Payment Method & Verification', () => {
      const mockAdminOrders = [
        {
          _id: 'order-upi-1',
          orderNumber: 'BRO-261013-UPI1',
          studentName: 'Aman Sharma',
          studentPhone: '9988776655',
          hostelBlock: 'BH1',
          roomNumber: '204',
          items: [{ name: 'Midnight Butter Maggi', price: 60, quantity: 2 }],
          subtotal: 120,
          deliveryFee: 15,
          totalAmount: 135,
          orderType: 'delivery',
          paymentMethod: 'upi',
          paymentStatus: 'pending_verification',
          status: 'placed',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'order-cod-2',
          orderNumber: 'BRO-261013-COD2',
          studentName: 'Rohan Verma',
          studentPhone: '9988776644',
          hostelBlock: 'BH2',
          roomNumber: '112',
          items: [{ name: 'Lays Chips', price: 20, quantity: 1 }],
          subtotal: 20,
          deliveryFee: 15,
          totalAmount: 35,
          orderType: 'delivery',
          paymentMethod: 'cash_on_delivery',
          paymentStatus: 'pending',
          status: 'placed',
          createdAt: new Date().toISOString(),
        },
      ];

      it('should display orders with Payment Method and Payment Status badges', async () => {
        vi.spyOn(apiService, 'getAllOrders').mockResolvedValue({
          data: { orders: mockAdminOrders, total: 2 },
        });

        render(
          <MemoryRouter initialEntries={['/admin/orders']}>
            <AdminOrdersPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getAllByText('BRO-261013-UPI1').length).toBeGreaterThan(0);
          expect(screen.getAllByText('BRO-261013-COD2').length).toBeGreaterThan(0);
        });

        // UPI Order has Pending Verification badge
        const pendingVerifBadges = screen.getAllByTestId('badge-status-pending-verification');
        expect(pendingVerifBadges.length).toBeGreaterThan(0);

        // COD Order has Pending badge
        const pendingBadges = screen.getAllByTestId('badge-status-pending');
        expect(pendingBadges.length).toBeGreaterThan(0);
      });

      it('should filter orders by payment method and payment status', async () => {
        vi.spyOn(apiService, 'getAllOrders').mockResolvedValue({
          data: { orders: mockAdminOrders, total: 2 },
        });

        render(
          <MemoryRouter initialEntries={['/admin/orders']}>
            <AdminOrdersPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getAllByText('BRO-261013-UPI1').length).toBeGreaterThan(0);
        });

        // Filter by UPI
        const paymentMethodFilter = screen.getByTestId('filter-payment-method');
        fireEvent.change(paymentMethodFilter, { target: { value: 'upi' } });

        expect(screen.getAllByText('BRO-261013-UPI1').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('BRO-261013-COD2').length).toBe(0);

        // Filter by Cash on Delivery
        fireEvent.change(paymentMethodFilter, { target: { value: 'cash_on_delivery' } });
        expect(screen.queryAllByText('BRO-261013-UPI1').length).toBe(0);
        expect(screen.getAllByText('BRO-261013-COD2').length).toBeGreaterThan(0);
      });

      it('should allow admin to verify UPI payment in the order details modal', async () => {
        vi.spyOn(apiService, 'getAllOrders').mockResolvedValue({
          data: { orders: mockAdminOrders, total: 2 },
        });
        const updatePaymentSpy = vi.spyOn(apiService, 'updatePaymentStatus').mockResolvedValue({
          data: {
            ...mockAdminOrders[0],
            paymentStatus: 'paid',
          },
        });

        render(
          <MemoryRouter initialEntries={['/admin/orders']}>
            <AdminOrdersPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getAllByText('BRO-261013-UPI1').length).toBeGreaterThan(0);
        });

        // Click View Details on the UPI order
        const viewButtons = screen.getAllByRole('button', { name: /View/i });
        fireEvent.click(viewButtons[0]);

        // Modal should display the UPI verification card
        await waitFor(() => {
          expect(screen.getByTestId('admin-payment-verification-card')).toBeInTheDocument();
        });

        expect(
          screen.getByText(/UPI Payment Awaiting Admin Verification/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/dheerajbhardwaj621@oksbi/i)).toBeInTheDocument();

        // Click Verify UPI Payment button
        const verifyBtn = screen.getByTestId('admin-verify-payment-btn');
        fireEvent.click(verifyBtn);

        await waitFor(() => {
          expect(updatePaymentSpy).toHaveBeenCalledWith(
            'order-upi-1',
            expect.objectContaining({ paymentStatus: 'paid' })
          );
        });
      });
    });
  });
});

