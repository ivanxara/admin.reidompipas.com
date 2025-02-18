"use client";

import MainContainer from "@/components/main-container";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { DataTableFilterField, DataTableRowAction } from "@/types/data-table";

import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useGlobalStore } from "@/store/global";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTable } from "@/hooks/use-data-table";
import { Button } from "@/components/ui/button";
import { CirclePlus, Instagram, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getColumns } from "./_components/columns";
import { InstagramLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const filterFields: DataTableFilterField<any>[] = [
  {
    id: "products.name",
    label: "Name",
    placeholder: "Filter by name...",
  },
];

const menuId = 1;
export default function Page() {
  const { menus } = useGlobalStore();
  const queryClient = useQueryClient();

  const queryProducts = useQuery({
    queryKey: ["products_menu", menuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newMenus")
        .select("*, products(*)")
        .eq("menuId", menuId)
        .order("special", { ascending: false })
        .order("everyday", { ascending: false })
        .order("status", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!menuId,
  });

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Product> | null>(null);

  const columns = getColumns({
    setRowAction,
    refetch: (row, updatedValues) => {
      queryClient.setQueryData(["products_menu", menuId], (oldData: any) =>
        oldData
          ? oldData.map((item: any) =>
              item.id === row.original.id ? { ...item, ...updatedValues } : item
            )
          : []
      );
    },
  });

  const { table } = useDataTable({
    columns,
    data: queryProducts.data || [],
  });

  const onSuccess = () => {
    queryProducts.refetch();
    setRowAction(null);
  };

  return (
    <MainContainer breadcrumbs={[{ label: "Daily", current: true }]}>
      <div className="w-full space-y-2.5 overflow-auto">
        <DataTableToolbar table={table} filterFields={filterFields}>
          <Link href="daily/instagram-story">
            <Button size="icon">
              <InstagramLogoIcon />
            </Button>
          </Link>
          <Link href="daily/send-messages">
            <Button size="icon">
              <Send />
            </Button>
          </Link>
        </DataTableToolbar>
        <DataTable table={table} />
      </div>
    </MainContainer>
  );
}
