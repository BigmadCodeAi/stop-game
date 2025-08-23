import { useI18n } from '../contexts/I18nContext';

// Map English category names to translation keys
const categoryTranslationMap: Record<string, string> = {
  'City': 'categories.city',
  'Country': 'categories.country',
  'Animal': 'categories.animal',
  'Food': 'categories.food',
  'Brand': 'categories.brand',
  'Movie/TV Show': 'categories.movieTvShow'
};

// Hook to translate categories
export const useCategoryTranslator = () => {
  const { t } = useI18n();
  
  const translateCategory = (category: string): string => {
    const translationKey = categoryTranslationMap[category];
    if (translationKey) {
      return t(translationKey);
    }
    // Fallback to original category if no translation found
    return category;
  };
  
  const translateCategories = (categories: string[]): string[] => {
    return categories.map(translateCategory);
  };
  
  return { translateCategory, translateCategories };
};
