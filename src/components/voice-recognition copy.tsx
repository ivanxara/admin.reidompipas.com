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

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const latestCategoriesRef = useRef(
    categories.map((el) => ({ id: el.id, name: el.name }))
  );
  const latestTagsRef = useRef(
    tags.map((el) => ({ id: el.id, name: el.name }))
  );
  const latestTranscriptRef = useRef(transcript);

  useEffect(() => {
    latestCategoriesRef.current = categories;
    latestTagsRef.current = tags;
  }, [categories, tags]);

  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("O reconhecimento de voz não é suportado neste navegador.");
      return;
    }

    recognitionRef.current = new (window as any).webkitSpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-PT";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
      latestTranscriptRef.current = finalTranscript;

      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      silenceTimeoutRef.current = setTimeout(() => {
        stopListening();
      }, 2000);
    };

    recognition.onerror = (event: any) => {
      console.error("Erro de Reconhecimento de Voz:", event.error);
      setError(event.error);
      stopListening();
    };

    return () => recognition.stop();
  }, []);

  const startListening = () => {
    setTranscript("");
    latestTranscriptRef.current = "";
    recognitionRef.current?.start();
    setIsListening(true);
  };

  const [rowAction, setRowAction] = useState<any>(null);

  const stopListening = async () => {
    try {
      // if (latestTranscriptRef.current) {
      //   const { data: products } = await supabase
      //     .from("products")
      //     .select("id, name");

      //   const { data, error } = await callGroq({
      //     data: {
      //       categories: latestCategoriesRef.current,
      //       tags: latestTagsRef.current,
      //       products,
      //     },
      //     prompt: latestTranscriptRef.current,
      //   });
      //   setRowAction({ type: "create", row: data });
      //   console.log(data, error);
      // }
      recognitionRef.current?.stop();
      setIsListening(false);
    } catch (err) {
      console.log({ err });
    }
  };

  return (
    <>
      <div className="fixed size-12 bottom-6 right-6 z-20 rounded-full z-50">
        <Microphone />
      </div>
      {/* <Button
        size="icon"
        variant={isListening ? "destructive" : "default"}
        className="fixed size-12 bottom-6 right-6 z-20 rounded-full"
        onClick={isListening ? stopListening : startListening}
      >
        <span>{latestTranscriptRef.current}</span>
        <Mic />
      </Button> */}

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
