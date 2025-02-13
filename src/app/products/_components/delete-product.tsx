import React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import ButtonLoading from "@/components/ui/button-loading";
import { DialogProps } from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";

interface DeleteProductProps {
  product: Product | null;
  onSuccess: () => void;
}

export default function DeleteProduct({
  product,
  onSuccess,
  ...props
}: DeleteProductProps & DialogProps) {
  const mutationDeleteProduct = useMutation({
    mutationFn: async () => {
      if (!product) throw Error("Error, no product selected");

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted successfully!");
      props.onOpenChange?.(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Error");
    },
  });

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <ButtonLoading
            variant="destructive"
            loading={mutationDeleteProduct.isPending}
            onClick={() => mutationDeleteProduct.mutate()}
          >
            Delete
          </ButtonLoading>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
