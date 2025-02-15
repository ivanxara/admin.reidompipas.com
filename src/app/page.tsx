"use client";

import MainContainer from "@/components/main-container";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableRowAction } from "@/types/data-table";
import { supabase } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getColumns } from "./columns";
import React from "react";
import { DataTable } from "@/components/data-table/data-table";
import VoiceRecognition from "@/components/voice-recognition";

function sortDishesByFrequency(dailyHistoryArray: any) {
  const dishCount: Record<string, { name: string; count: number }> = {};

  dailyHistoryArray.forEach((history: any) => {
    history?.data?.forEach((item: any) => {
      const product = item.products;
      if (product?.name) {
        dishCount[product.name] = {
          ...item,
          count: (dishCount[product.name]?.count || 0) + 1,
        };
      }
    });
  });

  return Object.values(dishCount).sort((a, b) => b.count - a.count);
}

export default function Page() {
  const queryDailyHistory = useQuery({
    queryKey: ["daily_history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_history").select("*");
      if (error) throw error;
      return sortDishesByFrequency(data) ?? [];
    },
  });

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Product> | null>(null);

  const columns = getColumns({
    setRowAction,
    refetch: queryDailyHistory.refetch,
  });

  const { table } = useDataTable({
    columns,
    data: queryDailyHistory.data || [],
  });

  return (
    <MainContainer breadcrumbs={[{ label: "Home", current: true }]}>
      <VoiceRecognition />
      <div className="flex flex-1 flex-col gap-4">
        <DataTable table={table} />
      </div>
    </MainContainer>
  );
}
