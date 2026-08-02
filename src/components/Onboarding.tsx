import { useState } from "react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "Ishq-e-Shayari",
    line: "हर दिल की एक कहानी है,\nहर कहानी का एक शेर।",
    caption: "A mehfil for original shayari — Hindi, Urdu, Roman & Punjabi.",
  },
  {
    title: "Likho, sunao",
    line: "लफ़्ज़ लिखो, या आवाज़ में\nअपना दर्द बहा दो।",
    caption: "Post text shayari or vertical video reels of your recitation.",
  },
  {
    title: "Mehfil sajao",
    line: "जो शेर दिल छू जाए,\nउसे सहेज लो।",
    caption: "Like, comment and save couplets to your private diary.",
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slide = slides[i]!;
  const last = i === slides.length - 1;

  return (
    <div className="flex min-h-screen flex-col justify-between px-7 py-14">
      <div className="animate-rise mt-10">
        <p className="font-ui text-xs tracking-[0.3em] text-muted-foreground uppercase">
          {slide.title}
        </p>
        <p className="script-hi mt-8 text-3xl leading-relaxed whitespace-pre-wrap text-foreground">
          {slide.line}
        </p>
        <p className="mt-6 max-w-xs text-sm text-muted-foreground">{slide.caption}</p>
      </div>

      <div>
        <div className="mb-6 flex gap-2">
          {slides.map((s, idx) => (
            <span
              key={s.title}
              className={`h-1 flex-1 rounded-full ${idx <= i ? "bg-gold" : "bg-border"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onDone} className="text-muted-foreground">
            Skip
          </Button>
          <Button className="flex-1" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? "Enter the mehfil" : "Next"}
          </Button>
        </div>
        <p className="mt-6 text-center font-ui text-[0.7rem] tracking-widest text-muted-foreground uppercase">
          Made by Shayar Peehu
        </p>
      </div>
    </div>
  );
}