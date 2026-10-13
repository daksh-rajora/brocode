import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider, CartContext } from '../context/CartContext';
import { SnackCard } from '../components/SnackCard';
import { SnackModal } from '../components/SnackModal';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
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

  describe('SnackCard Out-of-Stock State', () => {
    it('should display Out of Stock label and prevent adding to cart when stock is 0', () => {
      const outOfStockSnack = { ...mockSnack, stock: 0 };
      render(
        <CartProvider>
          <SnackCard snack={outOfStockSnack} />
        </CartProvider>
      );
      expect(screen.getAllByText('Out of Stock').length).toBeGreaterThan(0);
      const button = screen.getByRole('button', { name: /Out of Stock/i });
      expect(button).toBeDisabled();
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

  describe('Admin Panel Add Product: Live Price Preview', () => {
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
  });
});
