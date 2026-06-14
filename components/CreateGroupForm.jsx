"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("shared_expenses_token") || ""}`
      },
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setMessage(data.message || "Could not create group");
      return;
    }

    setName("");
    setMessage("Group created. Opening it now...");
    router.push(`/groups/${data.group.id}#add-expense`);
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Create a new group or trip</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Make a separate space for a trip, flat, event, or office expense group.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="group-name">Group name</Label>
          <Input
            id="group-name"
            placeholder="Example: Goa Trip, Manali Trip, Office Lunch"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <Button className="self-end" disabled={!name.trim() || isSaving}>
          {isSaving ? "Creating..." : "Create Group"}
        </Button>
      </form>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </Card>
  );
}
