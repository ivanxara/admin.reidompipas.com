"use client";

import MainContainer from "@/components/main-container";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { DataTableFilterField, DataTableRowAction } from "@/types/data-table";

import { getColumns } from "./_components/columns";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useGlobalStore } from "@/store/global";
import { DataTable } from "@/components/data-table/data-table";
import UpdateProduct from "./_components/update-product";
import DeleteProduct from "./_components/delete-product";
import { useDataTable } from "@/hooks/use-data-table";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import CreateProduct from "./_components/create-product";
import axios from "axios";

const filterFields: DataTableFilterField<any>[] = [
  {
    id: "name",
    label: "Name",
    placeholder: "Filter by name...",
  },
];

export default function Page() {
  const { menus, categories, tags } = useGlobalStore();

  const queryProducts = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(*), newMenus(menuId, menus(name))")
        .order("id", { ascending: false });
      return data || [];
    },
  });

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Product> | null>(null);

  const columns = getColumns({
    setRowAction,
    refetch: queryProducts.refetch,
    menus,
  });

  // Use the custom hook
  const { table } = useDataTable({
    columns,
    data: queryProducts.data || [],
  });

  const onSuccess = () => {
    queryProducts.refetch();
    setRowAction(null);
  };

  return (
    <MainContainer breadcrumbs={[{ label: "Products", current: true }]}>
      <div className="w-full space-y-2.5 overflow-auto">
        <DataTableToolbar table={table} filterFields={filterFields}>
          <Button onClick={() => setRowAction({ type: "create" })} size="sm">
            <CirclePlus className="size-4" />
            Product
          </Button>
        </DataTableToolbar>
        <DataTable table={table} />
      </div>
      {!!rowAction?.type && (
        <>
          <CreateProduct
            open={rowAction?.type === "create"}
            onOpenChange={() => setRowAction(null)}
            onSuccess={onSuccess}
          />
          <UpdateProduct
            open={rowAction?.type === "update"}
            onOpenChange={() => setRowAction(null)}
            product={rowAction?.row?.original ?? null}
            onSuccess={onSuccess}
          />
          <DeleteProduct
            open={rowAction?.type === "delete"}
            onOpenChange={() => setRowAction(null)}
            product={rowAction?.row?.original ?? null}
            onSuccess={onSuccess}
          />
        </>
      )}
    </MainContainer>
  );
}
