"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CompareCard } from "./CompareCard";
import { ComparePicker } from "./ComparePicker";
import type { CompareEntity } from "./types";

interface CompareSlotProps {
  targetType: "bot" | "server";
  paramName: "a" | "b";
  entity: CompareEntity | null;
  sharedTags: Set<string>;
}

/** One side of a compare page: either the resolved bot/server (with a
 * "Change" button that swaps in the search picker) or the picker itself
 * when nothing's selected yet for this side. Keyed by `entity?.id` from the
 * parent server component, so picking a new entity — which triggers a URL
 * change and a server refetch — remounts this back into display mode. */
export function CompareSlot({
  targetType,
  paramName,
  entity,
  sharedTags,
}: CompareSlotProps) {
  const [picking, setPicking] = useState(!entity);

  if (entity && !picking) {
    return (
      <div className="space-y-2">
        <CompareCard entity={entity} sharedTags={sharedTags} />
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setPicking(true)}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <ComparePicker
      targetType={targetType}
      paramName={paramName}
      placeholder={`Search ${targetType === "bot" ? "bots" : "servers"}...`}
    />
  );
}
