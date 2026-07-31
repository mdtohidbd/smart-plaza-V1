import { useEffect } from 'react';

/**
 * Custom hook that automatically refreshes data when the active shop changes
 * @param {Function} refreshFunction - Function to call when shop changes (e.g., query refetch)
 */
const useShopRefresh = (refreshFunction) => {
  useEffect(() => {
    const handleShopChange = () => {
      console.log('Shop changed, refreshing data');
      if (refreshFunction && typeof refreshFunction === 'function') {
        refreshFunction();
      }
    };

    window.addEventListener('shopChanged', handleShopChange);
    
    return () => {
      window.removeEventListener('shopChanged', handleShopChange);
    };
  }, [refreshFunction]);
};

export default useShopRefresh;