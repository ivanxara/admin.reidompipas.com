import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório"),
  price: z.coerce.number(),
  price2: z.coerce.number(),
  categoryId: z.coerce.number(),
  desc: z.string().optional(),
  tagId: z.coerce.number().nullable(),
});

export type ProductProps = z.infer<typeof productSchema>;
