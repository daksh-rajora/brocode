import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider, CartContext } from '../context/CartContext';
import { SnackCard } from '../components/SnackCard';
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
  describe('Formatters Utility', () => {
    it('should format numbers into Indian Rupee currency correctly', () => {
      expect(formatCurrency(60)).toBe('₹60');
      expect(formatCurrency(1250)).toBe('₹1,250');
      expect(formatCurrency(null)).toBe('₹0');
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
});
