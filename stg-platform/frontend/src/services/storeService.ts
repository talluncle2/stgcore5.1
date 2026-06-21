import { assertAdmin } from "./adminGuard";
import { deleteContent, readContent, upsertContent } from "./contentStorage";
import { isSupabaseEnabled, supabase } from "../lib/supabase";
import { AuthUser, Product, ProductPayload, StoreItem } from "../types/api";

const KEY = "store";
const now = new Date().toISOString();

type StoreRow = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  price_coins?: number | string | null;
  sale_price_coins?: number | string | null;
  price_brl?: number | string | null;
  sale_price_brl?: number | string | null;
  discount_percent?: number | null;
  stock?: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

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

function numberOrUndefined(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  return Number(value);
}

function rowToStoreItem(row: StoreRow): StoreItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    category: row.category || undefined,
    imageUrl: row.image_url || undefined,
    priceCoins: numberOrUndefined(row.price_coins),
    salePriceCoins: numberOrUndefined(row.sale_price_coins),
    priceBrl: numberOrUndefined(row.price_brl),
    salePriceBrl: numberOrUndefined(row.sale_price_brl),
    discountPercent: row.discount_percent ?? undefined,
    stock: row.stock ?? undefined,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function storeItemToRow(payload: Partial<StoreItem>) {
  return {
    name: payload.name,
    description: payload.description || null,
    category: payload.category || null,
    image_url: payload.imageUrl || null,
    price_coins: payload.priceCoins ?? 0,
    sale_price_coins: payload.salePriceCoins ?? null,
    price_brl: payload.priceBrl ?? 0,
    sale_price_brl: payload.salePriceBrl ?? null,
    discount_percent: payload.discountPercent ?? 0,
    stock: payload.stock ?? null,
    is_active: payload.isActive !== false,
    is_featured: payload.isFeatured === true,
  };
}

function storeItemToProduct(item: StoreItem): Product {
  return {
    product_id: item.id,
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    image_url: item.imageUrl,
    price: item.priceCoins ?? 0,
    price_coins: item.priceCoins,
    sale_price_coins: item.salePriceCoins,
    price_real: item.priceBrl,
    sale_price_brl: item.salePriceBrl,
    discount_percent: item.discountPercent,
    stock: item.stock,
    is_active: item.isActive,
    is_featured: item.isFeatured,
  };
}

export async function getStoreItems(): Promise<StoreItem[]> {
  if (!isSupabaseEnabled || !supabase) {
    return readContent<StoreItem>(KEY, defaultStoreItems);
  }

  const { data, error } = await supabase
    .from("store_items")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar a loja: ${error.message}`);
  return (data as StoreRow[]).map(rowToStoreItem);
}

export async function getFeaturedStoreItems(): Promise<StoreItem[]> {
  const items = await getStoreItems();
  return items.filter((item) => item.isActive && item.isFeatured);
}

export async function saveStoreItem(payload: Partial<StoreItem> & { id?: string }): Promise<StoreItem> {
  if (!payload.name?.trim()) throw new Error("O nome do item e obrigatorio.");

  if (!isSupabaseEnabled || !supabase) {
    return upsertContent(KEY, defaultStoreItems, payload);
  }

  const row = storeItemToRow({ ...payload, name: payload.name.trim() });
  const query = payload.id
    ? supabase.from("store_items").update(row).eq("id", payload.id)
    : supabase.from("store_items").insert(row);
  const { data, error } = await query.select("*").single();

  if (error) throw new Error(`Falha ao salvar o item: ${error.message}`);
  return rowToStoreItem(data as StoreRow);
}

export async function deleteStoreItem(id: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) {
    deleteContent(KEY, defaultStoreItems, id);
    return;
  }

  const { error } = await supabase.from("store_items").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir o item: ${error.message}`);
}

export async function getAdminProducts(): Promise<Product[]> {
  return (await getStoreItems()).map(storeItemToProduct);
}

export async function createProduct(payload: ProductPayload, currentUser: AuthUser | null): Promise<Product> {
  assertAdmin(currentUser);
  const item = await saveStoreItem({
    name: payload.name,
    description: payload.description,
    category: payload.category,
    imageUrl: payload.imageUrl || payload.image_url,
    priceCoins: payload.price_coins ?? payload.price,
    salePriceCoins: payload.sale_price_coins,
    priceBrl: payload.price_real,
    salePriceBrl: payload.sale_price_brl,
    discountPercent: payload.discount_percent,
    stock: payload.stock,
    isActive: payload.is_active !== false,
    isFeatured: Boolean(payload.is_featured || payload.featured || payload.destaque),
  });
  return storeItemToProduct(item);
}

export async function updateProduct(
  productId: string | number,
  payload: ProductPayload,
  currentUser: AuthUser | null
): Promise<Product> {
  assertAdmin(currentUser);
  const current = (await getStoreItems()).find((item) => item.id === String(productId));
  const item = await saveStoreItem({
    ...current,
    id: String(productId),
    name: payload.name ?? current?.name,
    description: payload.description ?? current?.description,
    category: payload.category ?? current?.category,
    imageUrl: payload.imageUrl || payload.image_url || current?.imageUrl,
    priceCoins: payload.price_coins ?? payload.price ?? current?.priceCoins,
    salePriceCoins: payload.sale_price_coins ?? current?.salePriceCoins,
    priceBrl: payload.price_real ?? current?.priceBrl,
    salePriceBrl: payload.sale_price_brl ?? current?.salePriceBrl,
    discountPercent: payload.discount_percent ?? current?.discountPercent,
    stock: payload.stock ?? current?.stock,
    isActive: payload.is_active ?? current?.isActive ?? true,
    isFeatured:
      payload.is_featured ?? payload.featured ?? payload.destaque ?? current?.isFeatured ?? false,
  });
  return storeItemToProduct(item);
}

export async function deleteProduct(productId: string | number, currentUser: AuthUser | null): Promise<void> {
  assertAdmin(currentUser);
  await deleteStoreItem(String(productId));
}

function unavailableCommerceAction(): never {
  throw new Error("Checkout e pedidos aguardam uma integracao segura de pagamentos.");
}

export async function createCheckoutSession(): Promise<never> {
  return unavailableCommerceAction();
}

export async function createOrder(): Promise<never> {
  return unavailableCommerceAction();
}

export async function getMyOrders(): Promise<never> {
  return unavailableCommerceAction();
}

export function productToStoreItem(product: Product): StoreItem {
  const timestamp = new Date().toISOString();
  return {
    id: String(product.product_id || product.id || product.name),
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
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
