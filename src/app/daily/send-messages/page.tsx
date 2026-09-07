'use client';

import MainContainer from '@/components/main-container';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { callGroq3 } from '@/helpers/groq';
import { useCopy } from '@/hooks/use-copy';
import { cn } from '@/lib/utils';
import { supabase } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Loader2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const menuId = 1;
const dailyMessageGptUrl =
  'https://chatgpt.com/g/g-6a9f361c23348191bd2d483292c3be95-mensagem-das-diarias';

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

        console.log({ formattedData });

        const { data: dataAI, error: err } = (await callGroq3(
          JSON.stringify(formattedData),
        )) as any;
        if (err) throw err;

        const textList: TextListItem[] = [
          {
            emoji: '🔸️',
            filter: (item) =>
              item.category === 'Carnes' && !item.everyday && !item.special,
          },
          { emoji: '▪️', filter: (item) => item.category === 'Carnes' && item.everyday },
          {
            emoji: '🥬',
            filter: (item) =>
              item.category === 'Vegetariano/Vegan' || item.category === 'Saladas',
          },
          { emoji: '🔹️', filter: (item) => item.category === 'Peixe' && !item.special },
          { emoji: '💎', filter: (item) => item.special },
          { emoji: '🔺️', items: [{ name: '' }, { name: '' }] },
          { emoji: '🍰', items: [{ name: '' }] },
        ];

        const newText = textList
          .map(({ emoji, filter, items }) =>
            (items ?? dataAI?.items.filter(filter!))
              .map((item: any) => `${emoji}${item.name}`)
              .join('\n'),
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
      {queryDailySms.isPending && (
        <div className="fixed left-0 top-0 h-full w-full flex items-center justify-center bg-background/50">
          <Loader2 className="animate-spin size-10" />
        </div>
      )}
      <div className="w-full flex justify-end gap-2">
        <Button variant="outline" asChild>
          <a href={dailyMessageGptUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
            Abrir no ChatGPT
          </a>
        </Button>
        <Button size="icon" onClick={() => copy(text)}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <div className="relative">
        <span
          className={cn(
            'text-muted-foreground text-sm absolute top-5 right-5',
            text.length > 333 && 'text-red-400',
          )}
        >
          {text.length}
        </span>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-[90dvh] max-h-full"
        />
      </div>
    </MainContainer>
  );
}
