"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import React, { useEffect } from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";

import { Form } from "@/components/ui/form";
import { DialogProps } from "@radix-ui/react-dialog";
import { toast } from "sonner";
import ButtonLoading from "@/components/ui/button-loading";
import ProductFields from "./product-fields";

const formSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório"),
  price: z.coerce.number(),
  price2: z.coerce.number(),
  categoryId: z.coerce.number(),
  desc: z.string().optional(),
  tagId: z.coerce.number().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateProduct {
  product: Product | null;
  onSuccess: () => void;
}

export default function UpdateProduct({
  product,
  onSuccess,
  ...props
}: UpdateProduct & DialogProps) {
  const form = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      desc: product?.desc || "",
    },
  });

  const mutationUpdateProduct = useMutation({
    mutationFn: async (values: FormData) => {
      if (!product) throw Error("Error, no product selected");

      const { error } = await supabase
        .from("products")
        .update({ ...values })
        .eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product updated successfully!");
      props.onOpenChange?.(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Error");
    },
  });

  const onSubmit = async (values: FormData) => {
    mutationUpdateProduct.mutate(values);
  };

  return (
    <Drawer {...props}>
      <DrawerContent className="lg:max-w-lg mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <DrawerHeader>
              <DrawerTitle>Product Details</DrawerTitle>
              <DrawerDescription>
                Update the details of the product
              </DrawerDescription>
            </DrawerHeader>
            <ProductFields form={form} />
            <DrawerFooter>
              <ButtonLoading loading={mutationUpdateProduct.isPending}>
                Save changes
              </ButtonLoading>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
