"use client";

import { useRecordVoice } from "@/hooks/use-record-voice";
import { Mic } from "lucide-react";
import { Button } from "./ui/button";

export default function Microphone() {
  const { recording, startRecording, stopRecording } = useRecordVoice();

  return (
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
  );
}
