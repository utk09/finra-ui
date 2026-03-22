export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  image: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
}
