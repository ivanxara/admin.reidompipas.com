"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/types/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase/client";
import { Switch } from "@/components/ui/switch";

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
  return [
    // {
    //   id: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //       className="translate-y-0.5"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //       className="translate-y-0.5"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      id: "products.name",
      accessorKey: "products.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => <div>{row.getValue("products.name")}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "special",
      header: "Special",
      cell: ({ row }) => (
        <Switch disabled defaultChecked={row.original.special} />
      ),
    },
    {
      accessorKey: "everyday",
      header: "Everday",
      cell: ({ row }) => (
        <Switch disabled defaultChecked={row.original.everyday} />
      ),
    },
    {
      accessorKey: "count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Count" />
      ),
      cell: ({ row }) => <div>{row.getValue("count")}</div>,
      enableHiding: false,
    },
  ];
}
