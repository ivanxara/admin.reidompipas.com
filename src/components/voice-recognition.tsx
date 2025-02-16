"use client";

import { useGlobalStore } from "@/store/global";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Mic } from "lucide-react";
import { callGroq } from "@/helpers/groq";
import CreateProduct from "@/app/products/_components/create-product";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import Microphone from "./microfone";

const VoiceRecognition = () => {
  const { categories, tags } = useGlobalStore();
  const [rowAction, setRowAction] = useState<any>(null);

  return (
    <>
      <Microphone />
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
};

export default VoiceRecognition;
