// Image Preloader Service
// Preloads all card images to prevent loading delays during gameplay

import { CARDS, getCardImagePath, getCardBackImagePath } from '../games/vetrolisci/cards.js';

class ImagePreloader {
  constructor() {
    this.loadedImages = new Set();
    this.failedImages = new Set();
    this.loadingPromises = new Map();
  }

  // Preload a single image and return a promise
  preloadImage(src) {
    if (this.loadedImages.has(src)) {
      return Promise.resolve(src);
    }

    if (this.failedImages.has(src)) {
      return Promise.reject(new Error(`Image failed to load: ${src}`));
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.add(src);
        this.loadingPromises.delete(src);
        resolve(src);
      };

      img.onerror = () => {
        this.failedImages.add(src);
        this.loadingPromises.delete(src);
        console.warn(`Failed to preload image: ${src}`);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Preload all card images
  async preloadAllCardImages() {
    const imagesToLoad = [];

    // Add card back image
    const backImagePath = getCardBackImagePath();
    if (backImagePath) {
      imagesToLoad.push(backImagePath);
    }

    // Add all card front images
    CARDS.forEach(card => {
      const frontImagePath = getCardImagePath(card);
      if (frontImagePath) {
        imagesToLoad.push(frontImagePath);
      }
    });

    console.log(`Preloading ${imagesToLoad.length} card images...`);

    // Load all images in parallel
    const loadPromises = imagesToLoad.map(src => 
      this.preloadImage(src).catch(err => {
        // Continue loading other images even if some fail
        return null;
      })
    );

    try {
      const results = await Promise.allSettled(loadPromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`Image preloading complete: ${successful} loaded, ${failed} failed`);
      
      return {
        total: imagesToLoad.length,
        loaded: successful,
        failed: failed,
        success: failed === 0
      };
    } catch (error) {
      console.error('Error during image preloading:', error);
      throw error;
    }
  }

  // Check if an image is loaded
  isImageLoaded(src) {
    return this.loadedImages.has(src);
  }

  // Get preloading statistics
  getStats() {
    return {
      loaded: this.loadedImages.size,
      failed: this.failedImages.size,
      loading: this.loadingPromises.size
    };
  }

  // Reset preloader state
  reset() {
    this.loadedImages.clear();
    this.failedImages.clear();
    this.loadingPromises.clear();
  }
}

// Export singleton instance
const imagePreloader = new ImagePreloader();
export default imagePreloader;