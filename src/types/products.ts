import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório"),
  price: z.coerce.number().optional(),
  price2: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  desc: z.string().optional(),
  tagId: z.coerce.number().optional(),
});

export type ProductProps = z.infer<typeof productSchema>;
