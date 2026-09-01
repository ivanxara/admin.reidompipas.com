import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const updateMenuSchema = z.object({
  confirmed: z.boolean(),
  menu: z.enum(["daily", "menu"]),
  updates: z
    .array(
      z
        .object({
          itemId: z.coerce.number().int().positive().optional(),
          productName: z.string().trim().min(1).optional(),
          price: z.number().finite().nonnegative().optional(),
          active: z.boolean().optional(),
          special: z.boolean().optional(),
          everyday: z.boolean().optional(),
        })
        .refine(({ itemId, productName }) => itemId !== undefined || productName, {
          message: "Indique itemId ou productName",
        })
        .refine(
          ({ price, active, special, everyday }) =>
            price !== undefined || active !== undefined || special !== undefined || everyday !== undefined,
          { message: "Indique price, active, special ou everyday" }
        )
    )
    .min(1, "Indique pelo menos uma atualização")
    .max(50, "É possível atualizar no máximo 50 pratos de cada vez"),
}).superRefine((value, context) => {
  if (value.menu === "menu" && value.updates.some(({ special, everyday }) => special !== undefined || everyday !== undefined)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["updates"],
      message: "Special e everyday só podem ser alterados no menu daily",
    });
  }
});

type MenuItem = {
  id: number;
  productId: number | null;
  menuId: number | null;
  status: boolean | null;
  special: boolean | null;
  everyday: boolean | null;
};
type Product = { id: number; name: string | null; price: number | null };
type ResolvedUpdate = {
  productId: number;
  productName: string;
  menuItemIds: number[];
  currentPrice: number | null;
  currentStatus: boolean | null;
  currentSpecial: boolean | null;
  currentEveryday: boolean | null;
  price?: number;
  active?: boolean;
  special?: boolean;
  everyday?: boolean;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { success: false, message, ...(details ? { details } : {}) },
    { status }
  );
}

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchProduct(products: Product[], requestedName: string) {
  const normalizedRequest = normalizeName(requestedName);
  const scored = products
    .filter((product): product is Product & { name: string } => Boolean(product.name))
    .map((product) => {
      const normalizedProduct = normalizeName(product.name);
      const requestWords = new Set(normalizedRequest.split(" "));
      const productWords = new Set(normalizedProduct.split(" "));
      const commonWords = [...requestWords].filter((word) => productWords.has(word));
      const wordScore = commonWords.length / Math.max(requestWords.size, productWords.size);
      const score = normalizedProduct === normalizedRequest
        ? 1
        : normalizedProduct.includes(normalizedRequest) || normalizedRequest.includes(normalizedProduct)
          ? 0.9
          : wordScore;
      return { product, score };
    })
    .filter(({ score }) => score >= 0.5)
    .sort((left, right) => right.score - left.score);

  if (!scored[0]) return null;
  if (scored[1] && scored[0].score === scored[1].score) {
    return { ambiguous: scored.slice(0, 3).map(({ product }) => product.name) };
  }
  return scored[0].product;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("O corpo do pedido deve ser um JSON válido", 400);
  }

  const result = updateMenuSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ success: false, message: "Dados inválidos", errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();
  try {
    const [{ data: products, error: productsError }, { data: menuItems, error: menuItemsError }] = await Promise.all([
      supabase.from("products").select("id, name, price"),
      supabase.from("newMenus").select("id, productId, menuId, status, special, everyday"),
    ]);
    if (productsError) throw productsError;
    if (menuItemsError) throw menuItemsError;

    const allProducts = (products ?? []) as Product[];
    const allMenuItems = (menuItems ?? []) as MenuItem[];
    const menuId = result.data.menu === "daily" ? 1 : 7;
    const resolvedUpdates: ResolvedUpdate[] = [];

    for (const [index, update] of result.data.updates.entries()) {
      let productId: number;
      let menuItemIds: number[];
      if (update.itemId !== undefined) {
        const menuItem = allMenuItems.find((item) => item.id === update.itemId && item.menuId === menuId);
        if (!menuItem?.productId) return jsonError(`Item não encontrado na atualização ${index + 1}`, 404);
        productId = menuItem.productId;
        menuItemIds = [menuItem.id];
      } else {
        const match = matchProduct(allProducts, update.productName!);
        if (!match) return jsonError(`Não encontrei o prato "${update.productName}"`, 404);
        if ("ambiguous" in match) return jsonError(`O nome "${update.productName}" corresponde a vários pratos`, 409, match.ambiguous);
        productId = match.id;
        menuItemIds = allMenuItems.filter((item) => item.productId === productId && item.menuId === menuId).map((item) => item.id);
        if (menuItemIds.length === 0) return jsonError(`O prato "${match.name}" não está no menu selecionado`, 404);
      }

      const product = allProducts.find((item) => item.id === productId);
      const currentMenuItem = allMenuItems.find((item) => menuItemIds.includes(item.id));
      if (!product) return jsonError(`Produto não encontrado na atualização ${index + 1}`, 404);
      resolvedUpdates.push({
        productId,
        productName: product.name ?? `Produto ${productId}`,
        menuItemIds,
        currentPrice: product.price,
        currentStatus: currentMenuItem?.status ?? null,
        currentSpecial: currentMenuItem?.special ?? null,
        currentEveryday: currentMenuItem?.everyday ?? null,
        price: update.price,
        active: update.active,
        special: update.special,
        everyday: update.everyday,
      });
    }

    if (!result.data.confirmed) {
      return NextResponse.json({
        success: true,
        confirmed: false,
        message: "Pré-visualização pronta. Apresente estas alterações ao utilizador e peça confirmação.",
        updates: resolvedUpdates.map(({ productId, productName, currentPrice, currentStatus, currentSpecial, currentEveryday, price, active, special, everyday }) => ({
          productId, productName, currentPrice, newPrice: price, currentStatus, newActive: active,
          currentSpecial, newSpecial: special, currentEveryday, newEveryday: everyday,
        })),
      });
    }

    for (const update of resolvedUpdates) {
      if (update.price !== undefined) {
        const { error } = await supabase.from("products").update({ price: update.price }).eq("id", update.productId);
        if (error) throw error;
      }
      const menuValues = {
        ...(update.active !== undefined ? { status: update.active } : {}),
        ...(update.special !== undefined ? { special: update.special } : {}),
        ...(update.everyday !== undefined ? { everyday: update.everyday } : {}),
      };
      if (Object.keys(menuValues).length > 0) {
        const { error } = await supabase.from("newMenus").update(menuValues).in("id", update.menuItemIds);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true, message: `${resolvedUpdates.length} prato(s) atualizado(s) com sucesso` });
  } catch (error) {
    console.error("Failed to update menu items", error);
    return jsonError("Não foi possível atualizar o menu", 500);
  }
}
