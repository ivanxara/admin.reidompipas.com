import { ImageResponse } from "next/og";

import { createAdminClient } from "@/utils/supabase/server";

import { parseStoryDate, sortStoryItems, type StoryMenuItem } from "../story";
import { DailyStoryImage } from "./story-image";

export const dynamic = "force-dynamic";

const DAILY_MENU_ID = 1;
const interFonts = Promise.all([
  fetch(
    "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZs.woff"
  ).then((response) => response.arrayBuffer()),
  fetch(
    "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZs.woff"
  ).then((response) => response.arrayBuffer()),
  fetch(
    "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZs.woff"
  ).then((response) => response.arrayBuffer()),
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const storyDate = parseStoryDate(requestUrl.searchParams.get("date"));

  if (!storyDate) {
    return Response.json(
      { success: false, message: "A data deve ter o formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return Response.json(
      { success: false, message: "A integração com a base de dados não está configurada" },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("newMenus")
      .select("id, order, special, everyday, products(id, name, categoryId)")
      .eq("menuId", DAILY_MENU_ID)
      .eq("status", true)
      .order("order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });

    if (error) throw error;

    const items = sortStoryItems(
      (data ?? []).flatMap((row) => {
        if (!row.products?.name) return [];

        return [{
          id: row.id,
          name: row.products.name,
          categoryId: row.products.categoryId,
          order: row.order,
          special: row.special ?? false,
          everyday: row.everyday ?? false,
        } satisfies StoryMenuItem];
      })
    );
    const normalItems = items.filter((item) => !item.special);
    const specialItems = items.filter((item) => item.special);
    const logoUrl = new URL("/logo_pipas.png", requestUrl.origin).toString();
    const disposition = requestUrl.searchParams.get("download") === "true"
      ? "attachment"
      : "inline";

    const [interRegular, interSemibold, interBold] = await interFonts;

    return new ImageResponse(
      DailyStoryImage({
        dateLabel: storyDate.label,
        logoUrl,
        normalItems,
        specialItems,
      }),
      {
        width: 1080,
        height: 1920,
        fonts: [
          { name: "Inter", data: interRegular, weight: 400, style: "normal" },
          { name: "Inter", data: interSemibold, weight: 600, style: "normal" },
          { name: "Inter", data: interBold, weight: 700, style: "normal" },
        ],
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `${disposition}; filename="${storyDate.filename}"`,
        },
      }
    );
  } catch (error) {
    console.error("Failed to generate daily story image", error);
    return Response.json(
      { success: false, message: "Não foi possível gerar a imagem das diárias" },
      { status: 500 }
    );
  }
}
