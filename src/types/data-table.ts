import type { ColumnSort, Row } from "@tanstack/react-table";
import { type z } from "zod";

export type StringKeyOf<TData> = Extract<keyof TData, string>;

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface DataTableFilterField<TData> {
  id: StringKeyOf<TData>;
  label: string;
  placeholder?: string;
  options?: Option[];
}

export interface DataTableRowAction<TData> {
  row?: Row<TData>;
  type: "update" | "delete" | "create";
}
