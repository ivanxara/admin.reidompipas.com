"use client";

import { useRecordVoice } from "@/hooks/use-record-voice";
import { Mic } from "lucide-react";
import { Button } from "./ui/button";
import { useGlobalStore } from "@/store/global";
import { useState } from "react";
import CreateProduct from "@/app/products/_components/create-product";
import { supabase } from "@/utils/supabase/client";
import { callGroq } from "@/helpers/groq";
import { toast } from "sonner";

export default function Microphone() {
  const { categories, tags } = useGlobalStore();
  const [rowAction, setRowAction] = useState<any>(null);

  const getAction = async (prompt: string) => {
    console.log({ prompt });
    try {
      const { data: products } = await supabase
        .from("products")
        .select("id, name");

      const { data, error } = await callGroq(prompt, {
        categories,
        tags,
        products,
      });
      setRowAction({ type: "create", row: data });
    } catch (err: any) {
      toast.error("getAction", err.toString());
    }
  };

  const { recording, startRecording, stopRecording } = useRecordVoice({
    onStopRecording: getAction,
  });

  return (
    <>
      <div className="fixed size-12 bottom-6 right-6 rounded-full z-50">
        <Button
          size="icon"
          variant={recording ? "destructive" : "default"}
          className="size-12 rounded-full"
          onClick={recording ? stopRecording : startRecording}
        >
          <Mic />
        </Button>
      </div>
      {rowAction?.type === "create" && (
        <CreateProduct
          open={rowAction?.type === "create"}
          onOpenChange={() => setRowAction(null)}
          onSuccess={() => console.log("lenha")}
          product={rowAction.row?.product}
        />
      )}
    </>
  );
}
