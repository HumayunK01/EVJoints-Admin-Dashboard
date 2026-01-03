import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} at ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function resolveImageUrl(photo: string): string {
  if (!photo) return "";
  if (photo.startsWith('http')) return photo;
  if (photo.startsWith('IMAGE/')) return `https://devapi.evjoints.com/${photo}`;
  if (photo.includes('api/attachment/')) return `https://devapi.evjoints.com/${photo.replace('api/', '')}`;
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${photo}`;
}
