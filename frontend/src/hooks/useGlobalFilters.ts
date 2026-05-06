"use client";

import { useContext } from "react";
import { FilterContext } from "@/providers/FilterProvider/FilterProvider";

export function useGlobalFilters() {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error("useGlobalFilters must be used inside FilterProvider");
  }

  return context;
}
