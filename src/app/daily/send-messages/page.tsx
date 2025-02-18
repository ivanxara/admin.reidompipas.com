"use client";

import MainContainer from "@/components/main-container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { callGroq2 } from "@/helpers/groq";
import { arr } from "@/utils/generic";
import { supabase } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import React, { useEffect } from "react";
import { toast } from "sonner";

const menuId = 1;
export default function Page() {
  const queryProducts = useQuery({
    queryKey: ["daily"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("newMenus")
          .select(
            "id, everyday, special, products(id, name, categories(id, name))"
          )
          .eq("menuId", menuId)
          .eq("status", true);

        const formatted = data?.map((el) => ({
          id: el.products?.id,
          special: el.special,
          everyday: el.everyday,
          name: el.products?.name,
          category: el.products?.categories?.name,
        }));

        console.log(formatted);

        const { data: message, error: err } = await callGroq2(formatted);
        console.log({ err });

        return message;
      } catch (err) {
        console.log(err);
        console.log(err.toString());

        toast.error(err.toString());
      }
    },
  });

  return (
    <MainContainer
      breadcrumbs={[
        { label: "Daily", href: "/daily" },
        { label: "Send Messages", current: true },
      ]}
    >
      <div className="relative">
        <Button
          size="sm"
          className="absolute top-6 right-6"
          onClick={() => {
            navigator.clipboard.writeText(queryProducts?.data || "");
            toast.success("Text copied");
          }}
        >
          <Copy />
          <span>Copy</span>
        </Button>
        <Textarea
          defaultValue={queryProducts.data || ""}
          className="h-[78dvh] max-h-full mt-4"
        ></Textarea>
      </div>
    </MainContainer>
  );
}
