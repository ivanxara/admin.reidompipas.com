import type { Database as DB } from "./database.types";

declare global {
  type Database = DB;
  type Menu = DB["public"]["Tables"]["menus"]["Row"];
  type RelationMenu = DB["public"]["Tables"]["newMenus"]["Row"];
  type Category = DB["public"]["Tables"]["categories"]["Row"];
  type DailyHistory = DB["public"]["Tables"]["daily_history"]["Row"];
  type Tag = DB["public"]["Tables"]["tags"]["Row"];
  type Product = DB["public"]["Tables"]["products"]["Row"] & {
    newMenus?: Menu[];
    categories?: Category[];
  };
}
