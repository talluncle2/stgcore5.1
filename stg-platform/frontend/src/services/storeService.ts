import { authedApiRequest, getProducts } from "./api";
import { assertAdmin } from "./adminGuard";
import { AuthUser, Product, ProductPayload } from "../types/api";

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
