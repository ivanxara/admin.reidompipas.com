'use client';

import MainContainer from '@/components/main-container';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTableRowAction } from '@/types/data-table';
import { supabase } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getColumns } from './columns';
import React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import Microphone from '@/components/microfone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, DollarSign } from 'lucide-react';
import { MENUS } from '@/utils/constants';

export default function Page() {
  const queryDashboard = useQuery({
    queryKey: ['daily_history'],
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_history').select('*');
      if (error) throw error;

      const dishCount: Record<string, { name: string; count: number }> = {};
      data.forEach((history: any) => {
        history?.data?.forEach((item: any) => {
          const product = item.products;
          if (product?.name) {
            dishCount[product.name] = {
              ...item,
              count: (dishCount[product.name]?.count || 0) + 1,
            };
          }
        });
      });
      const sortedList = Object.values(dishCount).sort((a, b) => b.count - a.count);

      const [{ count: countProducts }, { count: countDaily }, { count: countMenuProducts }] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase
          .from('newMenus')
          .select('id', { count: 'exact', head: true })
          .eq('menuId', MENUS.DAILY.ID)
          .eq('status', true),
        supabase
          .from('newMenus')
          .select('id', { count: 'exact', head: true })
          .eq('menuId', MENUS.MENU.ID)
          .eq('status', true),
      ]);
      return { history: sortedList ?? [], countProducts, countMenus: countDaily, countMenuProducts };
    },
  });

  const [rowAction, setRowAction] = React.useState<DataTableRowAction<Product> | null>(null);

  const columns = getColumns({
    setRowAction,
    refetch: queryDashboard.refetch,
  });

  const { table } = useDataTable({
    columns,
    data: queryDashboard.data?.history || [],
  });

  return (
    <MainContainer breadcrumbs={[{ label: 'Home', current: true }]}>
      {/* <Microphone /> */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Available Products</CardTitle>
              <Box className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queryDashboard.data?.countProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Daily Menu</CardTitle>
              <Box className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queryDashboard.data?.countMenus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Menu Products</CardTitle>
              <Box className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queryDashboard.data?.countMenuProducts}</div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <DataTable table={table} />
        </div>
      </div>
    </MainContainer>
  );
}
