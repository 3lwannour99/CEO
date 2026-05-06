import { useInventoryData } from "@/hooks/useInventoryData";

export function useAppBusy() {
  return useInventoryData().isBusy;
}
