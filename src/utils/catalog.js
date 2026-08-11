export const getCatalogData = (categoriesResponse = [], productsResponse = []) => {
  const fetchedCategories = Array.isArray(categoriesResponse)
    ? categoriesResponse
    : categoriesResponse?.data || [];
  const fetchedProducts = Array.isArray(productsResponse)
    ? productsResponse
    : productsResponse?.data || [];

  return {
    categories: fetchedCategories,
    products: fetchedProducts,
  };
};
