import { useState } from 'react';

export const useCopy = (timeout: number = 2000) => {
  const [copyTimeout, setCopyTimeout] = useState<NodeJS.Timeout | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const isCopied = (id?: string | number) => {
    id = id?.toString();
    if (id) return copiedMap[id] ?? false;
    return copied;
  };

  const copy = async (value: string, id?: string | number) => {
    id = id?.toString();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);

        if (copyTimeout && !id) {
          clearTimeout(copyTimeout);
        }

        setCopied(true);
        if (id) setCopiedMap((prev) => ({ ...prev, [id]: true }));

        const newTimeout = setTimeout(() => {
          setCopied(false);
          if (id) setCopiedMap((prev) => ({ ...prev, [id]: false }));
        }, timeout);

        setCopyTimeout(newTimeout);
      } else {
        throw new Error('Clipboard not supported');
      }
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Unknown error occurred while copying.');
    }
  };

  return { copy, copied, isCopied };
};
