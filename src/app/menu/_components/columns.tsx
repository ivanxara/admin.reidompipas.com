"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/types/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { supabase } from "@/utils/supabase/client";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Product> | null>
  >;
  refetch: () => void;
}

export function getColumns({
  setRowAction,
  refetch,
}: GetColumnsProps): ColumnDef<Product | any>[] {
  const toggleSwitch = async (key: string, val: boolean, id: number) => {
    try {
      const { error } = await supabase
        .from("newMenus")
        .update({ [key]: val })
        .eq("id", id);

      if (error) throw error;

      toast.success("Produto alterado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar o produto!");
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
      cell: ({ row }: any) => (
        <Switch
          defaultChecked={row.original.status}
          onCheckedChange={(val) =>
            toggleSwitch("status", val, row.original.id)
          }
        />
      ),
    },
    {
      accessorKey: "special",
      header: "Landing Page",
      cell: ({ row }: any) => (
        <Switch
          defaultChecked={row.original.special}
          onCheckedChange={(val) =>
            toggleSwitch("special", val, row.original.id)
          }
        />
      ),
    },
    // {
    //   id: "actions",
    //   cell: function Cell({ row }) {
    //     return (
    //       <DropdownMenu>
    //         <DropdownMenuTrigger asChild>
    //           <Button
    //             aria-label="Open menu"
    //             variant="ghost"
    //             className="flex size-8 p-0 data-[state=open]:bg-muted"
    //           >
    //             <Ellipsis className="size-4" aria-hidden="true" />
    //           </Button>
    //         </DropdownMenuTrigger>
    //         <DropdownMenuContent align="end" className="w-40">
    //           <DropdownMenuItem
    //             onSelect={() => setRowAction({ row, type: "delete" })}
    //           >
    //             Remove from this daily menu
    //             <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
    //           </DropdownMenuItem>
    //         </DropdownMenuContent>
    //       </DropdownMenu>
    //     );
    //   },
    //   size: 40,
    // },
  ];
}
