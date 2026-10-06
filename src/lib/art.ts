import type { WorkerClass } from "./types";

// Pixel-TV art lives in /public. Each worker class gets its own character.
export const LOGO = "/logo.jpg";
export const HERO = "/terminal.png";

export const CLASS_ART: Record<WorkerClass, string> = {
  scout: "/2.jpeg",
  analyst: "/1.jpeg",
  momentum: "/4.jpeg",
  sentinel: "/3.jpeg",
};

// A default face for a worker before a class is chosen.
export const DEFAULT_TV = "/1.jpeg";
