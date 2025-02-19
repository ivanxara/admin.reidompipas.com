'use client';

import MainContainer from '@/components/main-container';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { callGroq3 } from '@/helpers/groq';
import { useCopy } from '@/hooks/use-copy';
import { supabase } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const menuId = 1;

interface Product {
  id: number;
  name: string;
  category: string;
  special: boolean;
  everyday: boolean;
}

interface TextListItem {
  emoji: string;
  filter?: (item: Product) => boolean;
  items?: { name: string }[];
}

export default function Page() {
  const [text, setText] = useState('');
  const { copy, copied } = useCopy();

  const queryDailySms = useQuery({
    queryKey: ['daily_sms'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('newMenus')
          .select('id, everyday, special, products(id, name, categories(id, name))')
          .eq('menuId', menuId)
          .eq('status', true);
        if (error) throw error;

        const formattedData: Product[] =
          data?.map(({ products, special, everyday }) => ({
            id: products?.id ?? 0,
            name: products?.name ?? '',
            category: products?.categories?.name ?? '',
            special: special ?? false,
            everyday: everyday ?? false,
          })) || [];

        console.log(formattedData);

        const { data: dataAI, error: err } = (await callGroq3(JSON.stringify(formattedData))) as any;
        if (err) throw err;

        const textList: TextListItem[] = [
          { emoji: '🔸️', filter: (item) => item.category === 'Carnes' && !item.everyday && !item.special },
          { emoji: '▪️', filter: (item) => item.category === 'Carnes' && item.everyday },
          { emoji: '🔹️', filter: (item) => item.category === 'Peixe' && !item.special },
          { emoji: '💎', filter: (item) => item.special },
          { emoji: '🔺️', items: [{ name: '' }, { name: '' }] },
          { emoji: '🍰', items: [{ name: '' }] },
        ];

        const newText = textList
          .map(({ emoji, filter, items }) =>
            (items ?? dataAI?.items.filter(filter!)).map((item: any) => `${emoji}${item.name}`).join('\n'),
          )
          .join('\n\n');

        setText(`${dataAI?.label}\n\n${newText}`);
        return newText;
      } catch (err) {
        console.error('Error in query:', err);
        toast.error('error');
        return '';
      }
    },
  });

  return (
    <MainContainer
      breadcrumbs={[
        { label: 'Daily', href: '/daily' },
        { label: 'Send Messages', current: true },
      ]}
    >
      <Button size="icon" className="fixed bottom-6 right-6 z-10" onClick={() => copy(text)}>
        {copied ? <Check /> : <Copy />}
      </Button>
      <div className="relative">
        <span className="text-muted-foreground text-sm absolute top-2 right-3">{text.length}</span>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} className="h-[90dvh] max-h-full" />
      </div>
    </MainContainer>
  );
}
