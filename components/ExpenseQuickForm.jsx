"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExpenseQuickForm({ groupId, members }) {
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
    setMessage(response.ok ? "Expense added. Refresh to see it in the list." : data.message);
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={form.description} onChange={(event) => update("description", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input value={form.totalAmount} onChange={(event) => update("totalAmount", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input value={form.expenseDate} onChange={(event) => update("expenseDate", event.target.value)} />
        </div>
        <select className="h-10 rounded-md border px-3 text-sm" value={form.currency} onChange={(event) => update("currency", event.target.value)}>
          <option value="INR">INR</option>
          <option value="USD">USD</option>
        </select>
        <select className="h-10 rounded-md border px-3 text-sm" value={form.paidByUserId} onChange={(event) => update("paidByUserId", event.target.value)}>
          {members.map((member) => (
            <option key={member.id} value={member.userId}>{member.user.name}</option>
          ))}
        </select>
        <Button>Add Equal Expense</Button>
      </form>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </Card>
  );
}

