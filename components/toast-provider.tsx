"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type ToastContextValue = {
  notify: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue>({ notify: () => undefined });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");

  const value = useMemo(
    () => ({
      notify(next: string) {
        setMessage(next);
        window.setTimeout(() => setMessage(""), 2200);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-cyan-300/25 bg-slate-950/90 px-4 py-3 text-sm text-cyan-50 shadow-glow backdrop-blur">
          <CheckCircle2 className="h-5 w-5 text-cyan-300" />
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
