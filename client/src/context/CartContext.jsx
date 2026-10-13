import React, { createContext, useReducer, useEffect } from 'react';

export const CartContext = createContext();

const CART_STORAGE_KEY = 'brocode_cart_v1';
const HOSTEL_STORAGE_KEY = 'brocode_hostel_info_v1';

const ALLOWED_HOSTEL_BLOCKS = ['BH1', 'BH2', 'BH3-A', 'BH3-B'];

const getInitialState = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    const savedInfo = localStorage.getItem(HOSTEL_STORAGE_KEY);
    const parsedInfo = savedInfo ? JSON.parse(savedInfo) : null;

    return {
      items: savedCart ? JSON.parse(savedCart) : [],
      deliveryInfo: {
        studentName: parsedInfo?.studentName || '',
        studentPhone: parsedInfo?.studentPhone || '',
        hostelBlock: parsedInfo?.hostelBlock && ALLOWED_HOSTEL_BLOCKS.includes(parsedInfo.hostelBlock)
          ? parsedInfo.hostelBlock
          : 'BH1',
        roomNumber: parsedInfo?.roomNumber || '',
        deliveryNotes: parsedInfo?.deliveryNotes || '',
        paymentMethod: parsedInfo?.paymentMethod || 'upi_on_delivery',
      },
    };
  } catch (error) {
    console.error('Failed to parse cart from localStorage:', error);
    return {
      items: [],
      deliveryInfo: {
        studentName: '',
        studentPhone: '',
        hostelBlock: 'BH1',
        roomNumber: '',
        deliveryNotes: '',
        paymentMethod: 'upi_on_delivery',
      },
    };
  }
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload;
      const existingIndex = state.items.findIndex((item) => item.product._id === product._id);

      let newItems;
      if (existingIndex > -1) {
        newItems = [...state.items];
        const newQty = newItems[existingIndex].quantity + quantity;
        const maxStock = product.stock ?? 99;
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: Math.min(newQty, maxStock),
        };
      } else {
        newItems = [
          ...state.items,
          {
            product,
            quantity: Math.min(quantity, product.stock ?? 99),
          },
        ];
      }
      return { ...state, items: newItems };
    }

    case 'REMOVE_ITEM': {
      const productId = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => item.product._id !== productId),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.product._id !== productId),
        };
      }
      const newItems = state.items.map((item) => {
        if (item.product._id === productId) {
          const maxStock = item.product.stock ?? 99;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      });
      return { ...state, items: newItems };
    }

    case 'CLEAR_CART': {
      return { ...state, items: [] };
    }

    case 'UPDATE_DELIVERY_INFO': {
      return {
        ...state,
        deliveryInfo: { ...state.deliveryInfo, ...action.payload },
      };
    }

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, null, getInitialState);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  useEffect(() => {
    localStorage.setItem(HOSTEL_STORAGE_KEY, JSON.stringify(state.deliveryInfo));
  }, [state.deliveryInfo]);

  const addItem = (product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const removeItem = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const updateDeliveryInfo = (info) => {
    dispatch({ type: 'UPDATE_DELIVERY_INFO', payload: info });
  };

  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = state.items.reduce((acc, item) => {
    const rawPrice = item.product.price ?? item.product.sellingPrice ?? item.product.selling_price ?? 0;
    const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice) || 0;
    return acc + numPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        deliveryInfo: state.deliveryInfo,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        updateDeliveryInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
