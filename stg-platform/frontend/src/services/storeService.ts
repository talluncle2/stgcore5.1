import { authedApiRequest, getProducts } from "./api";
import { deleteContent, readContent, upsertContent } from "./contentStorage";
import { assertAdmin } from "./adminGuard";
import { AuthUser, Product, ProductPayload, StoreItem } from "../types/api";

const KEY = "store";
const now = new Date().toISOString();

export const defaultStoreItems: StoreItem[] = [
  {
    id: "coins-boost",
    name: "Boost de STG Coins",
    description: "Pacote promocional para resgates internos e eventos da comunidade.",
    category: "premium",
    imageUrl: "/assets/stg-elite-league.png",
    priceCoins: 2500,
    salePriceCoins: 1900,
    priceBrl: 29.9,
    salePriceBrl: 19.9,
    discountPercent: 33,
    isActive: true,
    isFeatured: true,
    stock: 50,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "operator-pass",
    name: "Passe Operador STG",
    description: "Acesso visual e recompensas digitais para temporadas da comunidade.",
    category: "digital",
    imageUrl: "/assets/stg-hero-operator.png",
    priceCoins: 1800,
    priceBrl: 14.9,
    discountPercent: 0,
    isActive: true,
    isFeatured: false,
    stock: 100,
    createdAt: now,
    updatedAt: now,
  },
];

function extractProducts(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).products)) {
    return (data as Record<string, unknown>).products as Product[];
  }
  return [];
}

export async function getAdminProducts(): Promise<Product[]> {
  try {
    const data = await authedApiRequest<unknown>("/admin/products");
    const products = extractProducts(data);
    return products.length > 0 ? products : getProducts(undefined, 100);
  } catch {
    return getProducts(undefined, 100);
  }
}

export async function createProduct(payload: ProductPayload, currentUser: AuthUser | null): Promise<Product> {
  assertAdmin(currentUser);
  return authedApiRequest<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  productId: string | number,
  payload: ProductPayload,
  currentUser: AuthUser | null
): Promise<Product> {
  assertAdmin(currentUser);
  return authedApiRequest<Product>(`/admin/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(productId: string | number, currentUser: AuthUser | null): Promise<void> {
  assertAdmin(currentUser);
  await authedApiRequest<void>(`/admin/products/${productId}`, {
    method: "DELETE",
  });
}

export function productToStoreItem(product: Product): StoreItem {
  const id = String(product.product_id || product.id || product.name);
  return {
    id,
    name: product.name,
    description: product.description,
    category: product.category,
    imageUrl: product.imageUrl || product.image_url,
    priceCoins: product.price_coins ?? product.price,
    salePriceCoins: product.sale_price_coins,
    priceBrl: product.price_real,
    salePriceBrl: product.sale_price_brl,
    discountPercent: product.discount_percent,
    isActive: product.is_active !== false,
    isFeatured: Boolean(product.is_featured || product.featured || product.destaque),
    stock: product.stock,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getStoreItems(): Promise<StoreItem[]> {
  try {
    const products = await getProducts(undefined, 100);
    if (products.length > 0) return products.map(productToStoreItem);
  } catch {
    // TODO: integrate with Replit API when product endpoints expose hybrid pricing.
  }
  return readContent<StoreItem>(KEY, defaultStoreItems);
}

export async function getFeaturedStoreItems(): Promise<StoreItem[]> {
  const items = await getStoreItems();
  return items.filter((item) => item.isActive && item.isFeatured);
}

export async function saveStoreItem(payload: Partial<StoreItem> & { id?: string }): Promise<StoreItem> {
  return upsertContent<StoreItem>(KEY, defaultStoreItems, payload);
}

export async function deleteStoreItem(id: string): Promise<void> {
  deleteContent<StoreItem>(KEY, defaultStoreItems, id);
}
