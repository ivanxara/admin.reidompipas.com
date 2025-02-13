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

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Product> | null>
  >;
  refetch: () => void;
  menus: Menu[];
}

export function getColumns({
  setRowAction,
  refetch,
  menus,
}: GetColumnsProps): ColumnDef<Product | any>[] {
  const toggleProductInMenu = async (menuId: number, productId: number) => {
    try {
      const { data: existingProduct } = await supabase
        .from("newMenus")
        .select("*, menus(*)")
        .eq("menuId", menuId)
        .eq("productId", productId)
        .single();

      if (existingProduct) {
        const { error: errorDelete } = await supabase
          .from("newMenus")
          .delete()
          .eq("id", existingProduct.id);

        if (errorDelete) throw errorDelete;

        toast.success("Product removed!");
      } else {
        const { error: errorUpsert } = await supabase.from("newMenus").upsert({
          menuId: menuId,
          productId: productId,
        });

        if (errorUpsert) throw errorUpsert;

        toast.success("Product added!");
      }
      refetch();
    } catch (err) {
      toast.error("Error toggling menu");
    }
  };

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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "relation_product_menu",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Related menu's" />
      ),
      cell: ({ row }) => {
        return (
          <div className="space-x-1">
            {row.original.newMenus.map(({ menuId, menus }: any) => (
              <Badge key={menuId} variant="outline" className="rounded-full">
                {menus.name}
              </Badge>
            ))}
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        return rowA.original.newMenus.length - rowB.original.newMenus.length;
      },
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Menu</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {menus.map((menu: any) => {
                    const isInMenu = row.original.newMenus?.some(
                      (menuAssociated: any) => menuAssociated.menuId === menu.id
                    );
                    return (
                      <DropdownMenuCheckboxItem
                        key={menu.id}
                        onSelect={() =>
                          toggleProductInMenu(menu.id, row.original.id)
                        }
                        checked={isInMenu}
                      >
                        {menu.name}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => setRowAction({ row, type: "update" })}
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => setRowAction({ row, type: "delete" })}
              >
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
