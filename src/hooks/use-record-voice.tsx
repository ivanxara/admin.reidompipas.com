import { GroqTranslate } from "@/helpers/groq";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

interface useRecordVoiceProps {
  onStopRecording: (text: any) => Promise<void>;
}

export const useRecordVoice = ({ onStopRecording }: useRecordVoiceProps) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recording, setRecording] = useState(false);
  const chunks = useRef<Blob[]>([]);

  const startRecording = () => {
    toast.success("start");
    if (mediaRecorder) {
      mediaRecorder.start();
      setRecording(true);
    }
  };

  const stopRecording = async () => {
    toast.error("stop");
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setRecording(false);
  };

  const initialMediaRecorder = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.onstart = () => {
      chunks.current = [];
    };

    mediaRecorder.ondataavailable = (ev) => {
      chunks.current.push(ev.data);
    };

    mediaRecorder.onstop = async () => {
      try {
        const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
        const audioFile = new File([audioBlob], "recorded_audio.wav", {
          type: "audio/wav",
        });
        const { data: text } = await GroqTranslate(audioFile);
        await onStopRecording(text);
      } catch (err: any) {
        toast.error("mediaRecorder.onstop", err.toString());
      }
    };

    setMediaRecorder(mediaRecorder);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator?.mediaDevices
        ?.getUserMedia({ audio: true })
        ?.then(initialMediaRecorder);
    }
  }, []);

  return { recording, startRecording, stopRecording };
};
