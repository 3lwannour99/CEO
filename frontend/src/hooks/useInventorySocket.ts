"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { InventoryUpdatedEvent } from "@/types/inventory";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? API_BASE_URL.replace(/\/api\/?$/, "");

interface UseInventorySocketOptions {
  debounceMs?: number;
  onInventoryUpdated?: (event: InventoryUpdatedEvent) => void;
}

export function useInventorySocket({ debounceMs = 750, onInventoryUpdated }: UseInventorySocketOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<InventoryUpdatedEvent | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const callbackRef = useRef(onInventoryUpdated);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = onInventoryUpdated;
  }, [onInventoryUpdated]);

  useEffect(() => {
    const socket: Socket = io(`${WS_BASE_URL}/inventory`, {
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
      setConnectionError(null);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      setConnected(false);
      setConnectionError(error.message);
    });

    socket.on("inventory.updated", (event: InventoryUpdatedEvent) => {
      setLastEvent(event);
      setLastUpdatedAt(event.lastSyncedAt);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        callbackRef.current?.(event);
      }, debounceMs);
    });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [debounceMs]);

  return {
    connected,
    connectionError,
    lastEvent,
    lastUpdatedAt,
  };
}
