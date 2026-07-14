"use client";

import { useEffect, useState } from "react";
import { QUIPS } from "@/lib/quips";

/** A rotating sports-bar one-liner. */
export function Quip({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setI(Math.floor(Math.random() * QUIPS.length));
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((n) => (n + 1) % QUIPS.length);
        setShow(true);
      }, 350);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"} ${className}`}
    >
      “{QUIPS[i]}”
    </span>
  );
}
