"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/types/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { supabase } from "@/utils/supabase/client";
import { Switch } from "@/components/ui/switch";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Product> | null>
  >;
  refetch: (row: any, updatedValues: any) => void;
}

export function getColumns({
  setRowAction,
  refetch,
}: GetColumnsProps): ColumnDef<Product | any>[] {
  const updateProductStatus = async (row: any, updatedValues: any) => {
    try {
      const { error } = await supabase
        .from("newMenus")
        .update(updatedValues)
        .eq("id", row.original.id);

      if (error) throw error;

      refetch(row, updatedValues);
      toast.success("Product updated successfully!");
    } catch (err) {
      toast.error("Error updateding product!");
    }
  };

  return [
    {
      id: "products.name",
      accessorKey: "products.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      cell: ({ row }) => <div>{row.getValue("products.name")}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: "Active",
      cell: ({ row }) => (
        <Switch
          defaultChecked={row.original.status}
          onCheckedChange={(val) =>
            updateProductStatus(row, {
              status: val,
              special: val ? row.original.special : false,
              everyday: val ? row.original.everyday : false,
            })
          }
        />
      ),
    },
    {
      accessorKey: "special",
      header: "Special",
      cell: ({ row }) => (
        <Switch
          defaultChecked={row.original.special}
          onCheckedChange={(val) =>
            updateProductStatus(row, {
              special: val,
              status: val ? true : row.original.status,
            })
          }
        />
      ),
    },
    {
      accessorKey: "everyday",
      header: "Everday",
      cell: ({ row }) => (
        <Switch
          defaultChecked={row.original.everyday}
          onCheckedChange={(val) =>
            updateProductStatus(row, {
              everyday: val,
              status: val ? true : row.original.status,
            })
          }
        />
      ),
    },
  ];
}
