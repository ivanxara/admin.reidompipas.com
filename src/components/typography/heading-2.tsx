import { cn } from "@/lib/utils";
import React from "react";

export default function Heading2({ children, className }: any) {
  return (
    <h2 className={cn("text-2xl tracking-tight", className)}>{children}</h2>
  );
}
