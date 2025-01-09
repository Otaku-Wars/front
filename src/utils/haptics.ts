// Different haptic patterns for different interactions
export const haptics = {
  // Light tap for regular interactions
  light: () => {
    try {
      navigator.vibrate(10);
    } catch (e) {
      // Silently fail if vibration is not supported
    }
  },

  // Medium tap for confirmations
  medium: () => {
    try {
      navigator.vibrate(20);
    } catch (e) {
      // Silently fail if vibration is not supported
    }
  },

  // Heavy tap for important actions
  heavy: () => {
    try {
      navigator.vibrate([30, 10, 30]);
    } catch (e) {
      // Silently fail if vibration is not supported
    }
  },

  // Success pattern
  success: () => {
    try {
      navigator.vibrate([10, 30, 10]);
    } catch (e) {
      // Silently fail if vibration is not supported
    }
  },

  // Error pattern
  error: () => {
    try {
      navigator.vibrate([40, 20, 40]);
    } catch (e) {
      // Silently fail if vibration is not supported
    }
  }
}; 