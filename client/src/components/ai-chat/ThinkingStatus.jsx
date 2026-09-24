import { useEffect, useState } from "react";

export const THINKING_WORDS = [
  "AI-ing",
  "Cooking",
  "Slopping",
  "Thinking",
  "Crunching",
  "Plotting",
  "Processing",
  "Generating",
  "Computing",
  "Crafting",
];

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function ThinkingStatus() {
  const [wordIndex, setWordIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const words = window.setInterval(() => {
      setWordIndex((index) => {
        let next = Math.floor(Math.random() * THINKING_WORDS.length);
        if (next === index) {
          next = (next + 1) % THINKING_WORDS.length;
        }
        return next;
      });
    }, 1500);
    const frames = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % SPINNER_FRAMES.length);
    }, 80);

    return () => {
      window.clearInterval(words);
      window.clearInterval(frames);
    };
  }, []);

  return (
    <span
      className="my-2 flex items-center gap-2 text-[13px] text-teal-700 dark:text-teal-300"
      dir="ltr"
      role="status"
      aria-label={THINKING_WORDS[wordIndex]}
    >
      <span className="w-[1.15em] font-mono text-[15px] leading-none" aria-hidden>
        {SPINNER_FRAMES[frameIndex]}
      </span>
      <span className="shimmer">
        {THINKING_WORDS[wordIndex]}
      </span>
    </span>
  );
}
