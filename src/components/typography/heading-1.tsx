import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function Heading1({ children, className, back }: any) {
  const router = useRouter();
  return (
    <div className="flex items-center">
      {!back && (
        <button onClick={() => router.back()}>
          <ChevronLeft className="mr-2" />
        </button>
      )}
      <h1 className={cn("text-3xl tracking-tighter font-bold antialiased", className)}>
        {children}
      </h1>
    </div>
  );
}
