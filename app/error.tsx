"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-xl">
      <h1 className="text-2xl font-bold text-white">AI Sales Copilot is recovering</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        A server read failed during this request. You can retry now, or turn on Demo from the app header to preview sample data.
      </p>
      <Button className="mt-5" onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        Retry
      </Button>
    </Card>
  );
}
