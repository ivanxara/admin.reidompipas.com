"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import React from "react";

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
import { ProductProps, productSchema } from "@/types/products";
import ProductFields from "./product-fields";

interface CreateProductProps {
  onSuccess: () => void;
  product?: Product | null;
}

export default function CreateProduct({
  onSuccess,
  product,
  ...props
}: CreateProductProps & DialogProps) {
  const form = useForm<ProductProps>({
    mode: "onChange",
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      desc: product?.desc || "",
      price: product?.price || undefined,
      price2: product?.price2 || undefined,
      categoryId: product?.categoryId || undefined,
      tagId: product?.tagId || undefined,
    },
  });

  const mutationCreateProduct = useMutation({
    mutationFn: async (values: ProductProps) => {
      const { error } = await supabase.from("products").insert({ ...values });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product created successfully!");
      props.onOpenChange?.(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Error");
    },
  });

  const onSubmit = async (values: ProductProps) => {
    mutationCreateProduct.mutate(values);
  };

  return (
    <Drawer {...props}>
      <DrawerContent className="lg:max-w-lg mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <DrawerHeader>
              <DrawerTitle>Create Product</DrawerTitle>
              <DrawerDescription>
                Enter the details of the new product
              </DrawerDescription>
            </DrawerHeader>
            <ProductFields form={form} />
            <DrawerFooter>
              <ButtonLoading loading={mutationCreateProduct.isPending}>
                Create Product
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
