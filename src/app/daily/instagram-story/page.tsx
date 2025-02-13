"use client";

import MainContainer from "@/components/main-container";
import Heading1 from "@/components/typography/heading-1";
import { arr, dates } from "@/utils/generic";
import { supabase } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { RefObject, useRef, useState } from "react";
import { pt } from "date-fns/locale";

import ImageLogoPipas from "@/assets/logo_pipas.png";
import { CalendarIcon, Download, Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toPng } from "html-to-image";
import { toast } from "sonner";

const menuId = 1;
export default function Page() {
  const elementRef = useRef(null);
  const [date, setDate] = useState<any>(new Date());

  const queryProducts = useQuery({
    queryKey: ["daily"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newMenus")
        .select("*, products(*)")
        .eq("menuId", menuId)
        .eq("status", true);

      // @ts-ignore
      const sortedProducts = data.sort((a: any, b: any) => {
        const categoryIdA = a.products.categoryId;
        const categoryIdB = b.products.categoryId;
        const everydayA = a.everyday;
        const everydayB = b.everyday;

        const priorityA = categoryIdA === 14 ? 2 : everydayA ? 1 : 0;
        const priorityB = categoryIdB === 14 ? 2 : everydayB ? 1 : 0;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return categoryIdA - categoryIdB;
      });

      return arr.groupBy(sortedProducts, "special");
    },
  });

  const htmlToImageConvert = (
    elementRef?: RefObject<HTMLElement> | RefObject<null>,
    filename: string = "my-image-name.png"
  ) => {
    if (!elementRef?.current) throw Error("Invalid ref");
    toPng(elementRef.current, {
      cacheBust: false,
      width: 1080,
      height: 1920,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        toast.error(String(err));
      });
  };

  return (
    <MainContainer
      breadcrumbs={[
        { label: "Daily", href: "/daily" },
        { label: "Instagram Story", current: true },
      ]}
    >
      <div className="flex gap-4 overflow-hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "pl-3 text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button
          size="icon"
          onClick={() =>
            htmlToImageConvert(
              elementRef,
              `diarias-${format(date, "dd-MM-yyyy", { locale: pt })}`
            )
          }
        >
          <Download />
        </Button>
      </div>
      {/* preview */}
      <div className="mt-4">
        <Heading1 back className="text-base">
          {dates.getDateExtensive(date)}
        </Heading1>
        <div className="flex flex-col gap-1 mt-4">
          {/* normal meals */}
          {queryProducts.data?.false.map((item: any, index: number) => (
            <span key={index} className="text-sm">
              {item.products.name}
            </span>
          ))}
          <hr className="my-4 mx-4" />
          {/* special meals */}
          {queryProducts.data?.true &&
            queryProducts.data?.true?.map((item: any, index: number) => (
              <span key={index} className="text-sm text-pretty antialiased">
                {item.products.name}
              </span>
            ))}
        </div>
      </div>
      {/* image */}
      <div className="hidden">
        <div
          ref={elementRef}
          className="overflow-hidden relative flex flex-col bg-brand-dark p-28 py-40 text-brand-light"
        >
          <div className="absolute left-0 w-full text-brand-dark flex py-6 px-28 items-center justify-center bottom-0 bg-brand-light">
            <div className="flex flex-col">
              <span className="text-[32px] font-semibold uppercase text-pretty antialiased">
                Reservas & Take-away
              </span>
              <span className="text-[32px] uppercase antialiased">
                912040915 / 256386200
              </span>
            </div>
            <Image
              className="size-[80px] ml-auto"
              src={ImageLogoPipas}
              alt="logo pipas"
            />
          </div>
          {/* header */}
          <Heading1
            back
            className="text-brand whitespace-nowrap uppercase font-bold mx-auto !leading-none text-[72px]"
          >
            Menu Executivo
          </Heading1>
          <Heading1
            back
            className="text-brand-light whitespace-nowrap font-bold mx-auto !leading-none text-[58px] mt-2"
          >
            {dates.getDateExtensive(date)}
          </Heading1>
          {/* normal meals */}
          <div className="flex flex-col gap-4 mt-16">
            {queryProducts.data?.false.map((item: any, index: number) => (
              <span key={index} className="text-[42px] text-pretty antialiased">
                {item.products.name}
              </span>
            ))}
          </div>
          {/* special meals */}
          {queryProducts.data?.true && (
            <>
              <hr className="my-12 mx-4" />
              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  <Star className="text-brand fill-brand size-10 mt-0.5" />
                  <h1 className="text-brand-light font-bold text-[48px]">
                    Especiais
                  </h1>
                </div>
                <div className="flex flex-col gap-4 mt-8">
                  {queryProducts.data?.true?.map((item: any, index: number) => (
                    <span
                      key={index}
                      className="text-[42px] text-pretty antialiased"
                    >
                      {item.products.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainContainer>
  );
}
