"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("aisha@example.com");
  const [password, setPassword] = useState("Aisha@123");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Login failed");
      return;
    }

    localStorage.setItem("shared_expenses_token", data.token);
    router.push("/dashboard");
  }

  return (
    <Card className="mx-auto mt-20 w-full max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Shared Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with a seeded flatmate account.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {message ? <p className="text-sm text-destructive">{message}</p> : null}
        <Button className="w-full" type="submit">Login</Button>
      </form>
    </Card>
  );
}

