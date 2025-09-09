/**
 * Google Maps Script Loader Utility
 * 
 * This utility ensures that the Google Maps JavaScript API is loaded only once
 * across the entire application, preventing the "multiple times" error.
 */

interface GoogleMapsLoaderState {
  isLoaded: boolean;
  isLoading: boolean;
  loadPromise: Promise<void> | null;
}

class GoogleMapsLoader {
  private state: GoogleMapsLoaderState = {
    isLoaded: false,
    isLoading: false,
    loadPromise: null,
  };

  private callbacks: (() => void)[] = [];

  /**
   * Load Google Maps script if not already loaded or loading
   */
  async load(): Promise<void> {
    // If already loaded, resolve immediately
    if (this.state.isLoaded) {
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.state.isLoading && this.state.loadPromise) {
      return this.state.loadPromise;
    }

    // Check if Google Maps is already available globally
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      this.state.isLoaded = true;
      return Promise.resolve();
    }

    // Check if script already exists in DOM
    if (typeof document !== 'undefined') {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        this.state.isLoading = true;
        this.state.loadPromise = new Promise((resolve, reject) => {
          const onLoad = () => {
            this.state.isLoaded = true;
            this.state.isLoading = false;
            this.notifyCallbacks();
            resolve();
          };
          
          const onError = () => {
            this.state.isLoading = false;
            this.state.loadPromise = null;
            reject(new Error('Failed to load Google Maps script'));
          };

          existingScript.addEventListener('load', onLoad, { once: true });
          existingScript.addEventListener('error', onError, { once: true });
        });
        return this.state.loadPromise;
      }
    }

    // Load the script
    this.state.isLoading = true;
    this.state.loadPromise = new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('Document is not available'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.state.isLoaded = true;
        this.state.isLoading = false;
        this.notifyCallbacks();
        resolve();
      };
      
      script.onerror = () => {
        this.state.isLoading = false;
        this.state.loadPromise = null;
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
    });

    return this.state.loadPromise;
  }

  /**
   * Check if Google Maps is loaded
   */
  isLoaded(): boolean {
    return this.state.isLoaded;
  }

  /**
   * Check if Google Maps is currently loading
   */
  isLoading(): boolean {
    return this.state.isLoading;
  }

  /**
   * Add a callback to be called when Google Maps is loaded
   */
  onLoad(callback: () => void): void {
    if (this.state.isLoaded) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  }

  /**
   * Notify all callbacks that Google Maps is loaded
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback());
    this.callbacks = [];
  }
}

// Global callback for Google Maps API
declare global {
  interface Window {
    initGoogleMaps: () => void;
  }
}

// Set up global callback
if (typeof window !== 'undefined') {
  window.initGoogleMaps = () => {
    // This will be called when Google Maps API loads
    console.log('Google Maps API loaded');
  };
}

// Export a singleton instance
export const googleMapsLoader = new GoogleMapsLoader();
