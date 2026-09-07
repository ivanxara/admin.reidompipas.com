import { NextResponse } from "next/server";

import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const DAILY_MENU_ID = 1;

type DailyMenuItem = {
  id: number;
  name: string;
  category: string | null;
  special: boolean;
  everyday: boolean;
};

/**
 * Returns the current daily-menu data only. The Custom GPT is responsible for
 * turning these items into the customer-facing message.
 */
export async function GET() {
  let supabase: ReturnType<typeof createAdminClient>;

  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { success: false, message: "A integração com a base de dados não está configurada" },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("newMenus")
      .select("id, order, everyday, special, products(id, name, categories(id, name))")
      .eq("menuId", DAILY_MENU_ID)
      .eq("status", true)
      .order("order", { ascending: true, nullsFirst: false });

    if (error) throw error;

    const items = (data ?? []).flatMap((item) => {
      const product = item.products;
      if (!product?.name) return [];

      return [{
        id: product.id,
        name: product.name,
        category: product.categories?.name ?? null,
        special: item.special ?? false,
        everyday: item.everyday ?? false,
      } satisfies DailyMenuItem];
    });

    return NextResponse.json({
      success: true,
      menu: "daily",
      generatedAt: new Date().toISOString(),
      items,
    });
  } catch (error) {
    console.error("Failed to fetch daily menu for message", error);
    return NextResponse.json(
      { success: false, message: "Não foi possível obter as diárias" },
      { status: 500 }
    );
  }
}
