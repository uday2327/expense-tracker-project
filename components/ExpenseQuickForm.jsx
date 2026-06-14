"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExpenseQuickForm({ groupId, members }) {
  const router = useRouter();
  const [form, setForm] = useState({
    description: "",
    totalAmount: "",
    currency: "INR",
    paidByUserId: members[0]?.userId || "",
    expenseDate: "2024-04-15",
    splitType: "EQUAL"
  });
  const [message, setMessage] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("shared_expenses_token") || ""}`
      },
      body: JSON.stringify({
        ...form,
        totalAmount: Number(form.totalAmount),
        splits: []
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Could not add expense");
      return;
    }

    setMessage("Expense added. Updating the list...");
    setForm((current) => ({
      ...current,
      description: "",
      totalAmount: ""
    }));
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Add a new expense</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add one bill here. It will be split equally between active group members for the selected date.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            placeholder="Example: Groceries"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            inputMode="decimal"
            placeholder="Example: 1200"
            value={form.totalAmount}
            onChange={(event) => update("totalAmount", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={form.expenseDate}
            onChange={(event) => update("expenseDate", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.currency} onChange={(event) => update("currency", event.target.value)}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Who paid?</Label>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.paidByUserId} onChange={(event) => update("paidByUserId", event.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.userId}>{member.user.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Split type</Label>
          <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
            Equal split
          </div>
        </div>
        <Button className="md:col-span-3" disabled={!form.description || !form.totalAmount}>
          Add Expense and Update Balances
        </Button>
      </form>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </Card>
  );
}
