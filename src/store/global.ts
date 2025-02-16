import { supabase } from "@/utils/supabase/client";
import { create } from "zustand";

type GlobalState = {
  menus: any;
  getMenus: any;
  categories: Category[];
  getCategories: any;
  tags: Tag[];
  getTags: any;
  products: Product[] | any;
  getProducts: any;
};

export const useGlobalStore = create<GlobalState>((set) => ({
  menus: [],
  getMenus: async () => {
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("Error fetching menus", error);
    } else {
      set({ menus: data || [] });
    }
  },
  categories: [],
  getCategories: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("Error fetching categories", error);
    } else {
      set({ categories: data || [] });
    }
  },
  tags: [],
  getTags: async () => {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      console.log("Error fetching tags", error);
    } else {
      set({ tags: data || [] });
    }
  },
  products: [],
  getProducts: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), newMenus(menuId, menus(name))")
      .order("id", { ascending: false });

    if (error) {
      console.log("Error fetching products", error);
    } else set({ products: data || [] });
  },
}));
