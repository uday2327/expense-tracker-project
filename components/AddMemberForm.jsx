"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddMemberForm({ groupId }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [joinedAt, setJoinedAt] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    const response = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("shared_expenses_token") || ""}`
      },
      body: JSON.stringify({
        name,
        email: email || undefined,
        joinedAt
      })
    });
    const data = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setMessage(data.message || "Could not add person");
      return;
    }

    setName("");
    setEmail("");
    setMessage(`${data.member.user.name} added to this group.`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
      <div className="space-y-2">
        <Label htmlFor="member-name">Person name</Label>
        <Input
          id="member-name"
          placeholder="Example: Rahul"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="member-email">Email optional</Label>
        <Input
          id="member-email"
          placeholder="rahul@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="member-joined">Joined on</Label>
        <Input
          id="member-joined"
          type="date"
          value={joinedAt}
          onChange={(event) => setJoinedAt(event.target.value)}
        />
      </div>
      <Button className="self-end" disabled={!name.trim() || !joinedAt || isSaving}>
        {isSaving ? "Adding..." : "Add Person"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground md:col-span-4">{message}</p> : null}
    </form>
  );
}
