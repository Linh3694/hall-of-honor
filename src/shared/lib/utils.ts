import { twMerge } from "tailwind-merge";

/** Gộp class Tailwind (xử lý trùng utility) — tham số phẳng như shadcn */
export function cn(
  ...inputs: (string | number | null | undefined | false)[]
) {
  return twMerge(
    ...(inputs.filter(Boolean) as string[])
  );
}