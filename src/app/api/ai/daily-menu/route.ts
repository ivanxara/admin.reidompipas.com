import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const DAILY_MENU_ID = 1;
const MAX_CHANGES = 50;

const changeSchema = z
  .object({
    productId: z.coerce.number().int().positive().optional(),
    productName: z.string().trim().min(1).optional(),
    active: z.boolean(),
  })
  .refine(({ productId, productName }) => productId !== undefined || productName, {
    message: "Indique productId ou productName",
  });

const requestSchema = z.object({
  confirmed: z.literal(true),
  changes: z
    .array(changeSchema)
    .min(1, "Indique pelo menos uma alteração")
    .max(MAX_CHANGES, `É possível alterar no máximo ${MAX_CHANGES} pratos de cada vez`),
});

type Product = {
  id: number;
  name: string | null;
  categories: { name: string | null } | null;
};

type DailyMenuRow = {
  id: number;
  productId: number | null;
  status: boolean | null;
  order: number | null;
  special: boolean | null;
  everyday: boolean | null;
};

type ResolvedChange = {
  productId: number;
  productName: string;
  active: boolean;
  previousActive: boolean;
  menuRowIds: number[];
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function jsonError(message: string, status: number, details?: unknown) {
  return jsonResponse(
    { success: false, message, ...(details === undefined ? {} : { details }) },
    status
  );
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshteinDistance(left: string, right: string) {
  const distances = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previousDiagonal = distances[0];
    distances[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previous = distances[rightIndex];
      distances[rightIndex] =
        left[leftIndex - 1] === right[rightIndex - 1]
          ? previousDiagonal
          : Math.min(previousDiagonal, distances[rightIndex], distances[rightIndex - 1]) + 1;
      previousDiagonal = previous;
    }
  }

  return distances[right.length];
}

function similarity(left: string, right: string) {
  if (!left && !right) return 1;
  return 1 - levenshteinDistance(left, right) / Math.max(left.length, right.length);
}

function scoreProductName(requestedName: string, productName: string) {
  const requested = normalizeName(requestedName);
  const product = normalizeName(productName);

  if (requested === product) return 1;

  const phraseScore = similarity(requested, product);
  const requestedWords = requested.split(" ").filter(Boolean);
  const productWords = product.split(" ").filter(Boolean);
  const wordScore =
    requestedWords.reduce((total, requestedWord) => {
      const best = Math.max(
        0,
        ...productWords.map((productWord) => similarity(requestedWord, productWord))
      );
      return total + best;
    }, 0) / Math.max(requestedWords.length, productWords.length, 1);
  const containsScore =
    requested.length >= 4 && (product.includes(requested) || requested.includes(product)) ? 0.88 : 0;

  return Math.max(phraseScore * 0.7 + wordScore * 0.3, containsScore);
}

function matchProduct(products: Product[], requestedName: string) {
  const matches = products
    .filter((product): product is Product & { name: string } => Boolean(product.name))
    .map((product) => ({ product, score: scoreProductName(requestedName, product.name) }))
    .filter(({ score }) => score >= 0.58)
    .sort((left, right) => right.score - left.score);

  const best = matches[0];
  if (!best) return { kind: "missing" as const };

  const closeMatches = matches.filter(({ score }) => best.score - score < 0.08);
  if (best.score < 1 && closeMatches.length > 1) {
    return {
      kind: "ambiguous" as const,
      alternatives: closeMatches.slice(0, 5).map(({ product }) => ({
        productId: product.id,
        productName: product.name,
      })),
    };
  }

  return { kind: "matched" as const, product: best.product };
}

async function loadMenuData(supabase: ReturnType<typeof createAdminClient>) {
  const [{ data: products, error: productsError }, { data: menuRows, error: menuRowsError }] =
    await Promise.all([
      supabase.from("products").select("id, name, categories(name)").order("name"),
      supabase
        .from("newMenus")
        .select("id, productId, status, order, special, everyday")
        .eq("menuId", DAILY_MENU_ID)
        .order("order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true }),
    ]);

  if (productsError) throw productsError;
  if (menuRowsError) throw menuRowsError;

  return {
    products: (products ?? []) as Product[],
    menuRows: (menuRows ?? []) as DailyMenuRow[],
  };
}

function activeProducts(products: Product[], menuRows: DailyMenuRow[]) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const seen = new Set<number>();

  return menuRows.flatMap((row) => {
    if (!row.status || row.productId === null || seen.has(row.productId)) return [];

    const product = productById.get(row.productId);
    if (!product?.name) return [];

    seen.add(row.productId);
    return [{
      productId: product.id,
      productName: product.name,
      category: product.categories?.name ?? null,
      special: row.special ?? false,
      everyday: row.everyday ?? false,
    }];
  });
}

function createDatabaseClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = createDatabaseClient();
  if (!supabase) {
    return jsonError("A integração com a base de dados não está configurada", 503);
  }

  try {
    const { products, menuRows } = await loadMenuData(supabase);
    const items = activeProducts(products, menuRows);

    return jsonResponse({
      success: true,
      menu: "daily",
      count: items.length,
      activeProducts: items,
    });
  } catch (error) {
    console.error("Failed to fetch active daily products", error);
    return jsonError("Não foi possível obter os pratos ativos das diárias", 500);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("O corpo do pedido deve ser um JSON válido", 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Dados inválidos", 400, parsed.error.flatten().fieldErrors);
  }

  const supabase = createDatabaseClient();
  if (!supabase) {
    return jsonError("A integração com a base de dados não está configurada", 503);
  }

  try {
    const { products, menuRows } = await loadMenuData(supabase);
    const productById = new Map(products.map((product) => [product.id, product]));
    const resolvedByProductId = new Map<number, ResolvedChange>();

    for (const change of parsed.data.changes) {
      let product: Product | undefined;

      if (change.productId !== undefined) {
        product = productById.get(change.productId);
        if (!product?.name) {
          return jsonError(`Não encontrei o produto com o ID ${change.productId}`, 404);
        }
      } else {
        const match = matchProduct(products, change.productName!);
        if (match.kind === "missing") {
          return jsonError(`Não encontrei o prato “${change.productName}”`, 404);
        }
        if (match.kind === "ambiguous") {
          return jsonError(
            `O nome “${change.productName}” pode corresponder a vários pratos`,
            409,
            { alternatives: match.alternatives }
          );
        }
        product = match.product;
      }

      const existing = resolvedByProductId.get(product.id);
      if (existing && existing.active !== change.active) {
        return jsonError(`O pedido contém estados diferentes para “${product.name}”`, 409);
      }

      const rows = menuRows.filter((row) => row.productId === product.id);
      resolvedByProductId.set(product.id, {
        productId: product.id,
        productName: product.name!,
        active: change.active,
        previousActive: rows.some((row) => row.status === true),
        menuRowIds: rows.map((row) => row.id),
      });
    }

    const resolvedChanges = [...resolvedByProductId.values()];
    const rowsToActivate = resolvedChanges
      .filter((change) => change.active && change.menuRowIds.length > 0)
      .flatMap((change) => change.menuRowIds);
    const rowsToDeactivate = resolvedChanges
      .filter((change) => !change.active && change.menuRowIds.length > 0)
      .flatMap((change) => change.menuRowIds);
    const productsToAdd = resolvedChanges.filter(
      (change) => change.active && change.menuRowIds.length === 0
    );

    if (rowsToActivate.length > 0) {
      const { error } = await supabase
        .from("newMenus")
        .update({ status: true })
        .in("id", rowsToActivate);
      if (error) throw error;
    }

    if (rowsToDeactivate.length > 0) {
      const { error } = await supabase
        .from("newMenus")
        .update({ status: false })
        .in("id", rowsToDeactivate);
      if (error) throw error;
    }

    if (productsToAdd.length > 0) {
      const { error } = await supabase.from("newMenus").insert(
        productsToAdd.map((change) => ({
          menuId: DAILY_MENU_ID,
          productId: change.productId,
          status: true,
        }))
      );
      if (error) throw error;
    }

    const { products: refreshedProducts, menuRows: refreshedRows } = await loadMenuData(supabase);
    const items = activeProducts(refreshedProducts, refreshedRows);
    const changed = resolvedChanges.filter(
      (change) => change.previousActive !== change.active
    ).length;

    return jsonResponse({
      success: true,
      message:
        changed === 0
          ? "Os pratos já tinham o estado pedido"
          : `${changed} prato(s) atualizado(s) com sucesso`,
      changes: resolvedChanges.map(({ menuRowIds: _menuRowIds, ...change }) => ({
        ...change,
        changed: change.previousActive !== change.active,
      })),
      activeProducts: items,
    });
  } catch (error) {
    console.error("Failed to update active daily products", error);
    return jsonError("Não foi possível atualizar os pratos ativos das diárias", 500);
  }
}
