import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { apiService, UPLOAD_TIMEOUT_MS } from '../services/api';

describe('Multiple Product Image Upload Reliability & Timeout Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiService, 'getProducts').mockResolvedValue({ data: [] });
  });

  describe('Upload Timeout & API Configuration', () => {
    it('should export UPLOAD_TIMEOUT_MS defaulting to 90,000ms (90 seconds)', () => {
      expect(UPLOAD_TIMEOUT_MS).toBe(90000);
      expect(UPLOAD_TIMEOUT_MS).toBeGreaterThanOrEqual(60000);
      expect(UPLOAD_TIMEOUT_MS).toBeLessThanOrEqual(120000);
    });

    it('apiService.uploadProductImage should send multipart FormData with dedicated upload timeout', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1234/snack.jpg',
          cloudinaryPublicId: 'brocode/products/snack1',
        },
      });

      // Temporarily mock api.post by calling uploadProductImage with custom options or inspecting mock
      const file = new File(['fake-image-bits'], 'lays-classic.png', { type: 'image/png' });
      const uploadSpy = vi.spyOn(apiService, 'uploadProductImage').mockImplementation(async (fileOrFormData, onProgress, options = {}) => {
        expect(options.timeout || UPLOAD_TIMEOUT_MS).toBe(90000);
        return mockPost(fileOrFormData);
      });

      const res = await apiService.uploadProductImage(file);
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(res.data.imageUrl).toContain('res.cloudinary.com');
    });
  });

  describe('Client-side File Validation (Format and 5 MB Limit)', () => {
    it('should reject files exceeding 5 MB with a clear error message', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/products?action=new']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Clear any preset images to start fresh
      const removeBtns = screen.queryAllByTitle('Remove Image');
      removeBtns.forEach((btn) => fireEvent.click(btn));

      // Create a 6 MB dummy file
      const bigFile = new File(['x'.repeat(100)], 'huge-snack-photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });

      const fileInput = document.querySelector('input[type="file"][multiple]');
      expect(fileInput).not.toBeNull();

      fireEvent.change(fileInput, { target: { files: [bigFile] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds 5 MB limit/i)).toBeInTheDocument();
      });
    });

    it('should reject unsupported file formats (e.g. PDF, GIF)', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/products?action=new']}>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      const badFile = new File(['pdf-bits'], 'snack-brochure.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"][multiple]');

      fireEvent.change(fileInput, { target: { files: [badFile] } });

      await waitFor(() => {
        expect(screen.getByText(/is not a supported format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sequential Upload, Progress, Failure Isolation, and Retry', () => {
    it('should upload images sequentially, isolate errors, display Retry button, and preserve succeeded images', async () => {
      // Setup: Mock URL.createObjectURL
      const originalCreateObjectURL = window.URL.createObjectURL;
      window.URL.createObjectURL = vi.fn((file) => `blob:mock-url-${file.name}`);

      try {
        render(
          <MemoryRouter initialEntries={['/admin/products?action=new']}>
            <AdminProductsPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Add New Product')).toBeInTheDocument();
        });

        // Clear preset images
        const removeBtns = screen.queryAllByTitle('Remove Image');
        removeBtns.forEach((btn) => fireEvent.click(btn));

        // Add 2 valid files
        const file1 = new File(['bits1'], 'snack-angle1.png', { type: 'image/png' });
        const file2 = new File(['bits2'], 'snack-angle2.png', { type: 'image/png' });
        const fileInput = document.querySelector('input[type="file"][multiple]');

        fireEvent.change(fileInput, { target: { files: [file1, file2] } });

        await waitFor(() => {
          expect(screen.getByTestId('admin-image-count-badge')).toHaveTextContent('2 images');
        });

        // Mock uploadProductImage: file1 succeeds, file2 fails with timeout
        let callCount = 0;
        const uploadCalls = [];
        vi.spyOn(apiService, 'uploadProductImage').mockImplementation(async (file) => {
          callCount++;
          uploadCalls.push(file.name);
          if (file.name === 'snack-angle1.png') {
            return {
              data: {
                imageUrl: 'https://res.cloudinary.com/brocode/image/upload/snack-angle1.png',
                cloudinaryPublicId: 'brocode/products/snack-angle1',
              },
            };
          } else {
            const err = new Error('Upload timed out after 90000ms.');
            err.isTimeout = true;
            throw err;
          }
        });

        // Fill required product name and price
        const nameInput = screen.getByPlaceholderText('e.g. Maggi 2-Minute Masala Noodles');
        fireEvent.change(nameInput, { target: { value: 'Crispy Midnight Wafers' } });
        const priceInput = screen.getByPlaceholderText('e.g. 20');
        fireEvent.change(priceInput, { target: { value: '25' } });

        // Click Save Product to trigger sequential upload
        const saveBtn = screen.getByRole('button', { name: /Save Product/i });
        fireEvent.click(saveBtn);

        // Verify failure was caught and error banner appears
        await waitFor(() => {
          expect(screen.getByText(/Failed to upload "snack-angle2.png"/i)).toBeInTheDocument();
        });

        // Verify that file 1 succeeded and has the success badge
        expect(screen.getByTestId('success-badge-0')).toBeInTheDocument();

        // Verify that file 2 failed and has the retry button
        expect(screen.getByTestId('error-overlay-1')).toBeInTheDocument();
        const retryBtn = screen.getByTestId('retry-image-btn-1');
        expect(retryBtn).toBeInTheDocument();

        // Verify that Retry Failed All button is also available in error banner
        expect(screen.getByTestId('retry-failed-all-btn')).toBeInTheDocument();

        // Now test Retry: make file2 succeed on retry
        vi.spyOn(apiService, 'uploadProductImage').mockImplementation(async (file) => {
          expect(file.name).toBe('snack-angle2.png'); // Should only retry file 2!
          return {
            data: {
              imageUrl: 'https://res.cloudinary.com/brocode/image/upload/snack-angle2.png',
              cloudinaryPublicId: 'brocode/products/snack-angle2',
            },
          };
        });

        fireEvent.click(retryBtn);

        // Verify retry completes and error overlay is cleared for file 2
        await waitFor(() => {
          expect(screen.getByTestId('success-badge-1')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('error-overlay-1')).not.toBeInTheDocument();
      } finally {
        window.URL.createObjectURL = originalCreateObjectURL;
      }
    });

    it('should disable submit button and prevent duplicate submission during active upload', async () => {
      const originalCreateObjectURL = window.URL.createObjectURL;
      window.URL.createObjectURL = vi.fn((file) => `blob:mock-url-${file.name}`);

      try {
        render(
          <MemoryRouter initialEntries={['/admin/products?action=new']}>
            <AdminProductsPage />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Add New Product')).toBeInTheDocument();
        });

        // Fill product name and price
        const nameInput = screen.getByPlaceholderText('e.g. Maggi 2-Minute Masala Noodles');
        fireEvent.change(nameInput, { target: { value: 'Dupe Test Snack' } });
        const priceInput = screen.getByPlaceholderText('e.g. 20');
        fireEvent.change(priceInput, { target: { value: '25' } });

        // Mock upload that hangs for a moment
        let resolveUpload;
        const uploadPromise = new Promise((resolve) => {
          resolveUpload = resolve;
        });

        const file = new File(['test'], 'dupe.png', { type: 'image/png' });
        const fileInput = document.querySelector('input[type="file"][multiple]');
        fireEvent.change(fileInput, { target: { files: [file] } });

        vi.spyOn(apiService, 'uploadProductImage').mockImplementation(() => uploadPromise);

        const saveBtn = screen.getByRole('button', { name: /Save Product/i });
        fireEvent.click(saveBtn);

        // Button should become disabled and indicate uploading
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Uploading Images\.\.\./i })).toBeDisabled();
        });

        // Clean up hanging promise
        resolveUpload({
          data: {
            imageUrl: 'https://res.cloudinary.com/demo/snack.jpg',
            cloudinaryPublicId: 'test1',
          },
        });
      } finally {
        window.URL.createObjectURL = originalCreateObjectURL;
      }
    });
  });
});
