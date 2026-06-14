"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ImportUploader({ defaultGroupId }) {
  const [file, setFile] = useState(null);
  const [groupId, setGroupId] = useState(defaultGroupId || "");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem("shared_expenses_token") || ""}` };
  }

  async function upload(event) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("groupId", groupId);

    const response = await fetch("/api/import", {
      method: "POST",
      headers: authHeaders(),
      body: formData
    });
    const data = await response.json();
    setResult(data);
    if (!response.ok) setMessage(data.message || "Import review failed");
  }

  async function confirm() {
    const response = await fetch(`/api/import/${result.session.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ groupId })
    });
    const data = await response.json();
    setResult({ ...data, anomalies: data.session?.anomalies || [] });
    setMessage(response.ok ? "Import confirmed" : data.message);
  }

  async function reject() {
    const response = await fetch(`/api/import/${result.session.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ reason: "Rejected during anomaly review" })
    });
    const data = await response.json();
    setResult({ ...data, anomalies: data.session?.anomalies || [] });
    setMessage(response.ok ? "Import rejected" : data.message);
  }

  async function downloadReport() {
    if (!result?.session?.id) return;

    const response = await fetch(`/api/import/${result.session.id}/report`, {
      headers: authHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Report download failed");
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import-report-${result.session.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={upload} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Input value={groupId} onChange={(event) => setGroupId(event.target.value)} placeholder="Group ID" />
          <Input type="file" accept=".csv" onChange={(event) => setFile(event.target.files?.[0])} />
          <Button disabled={!file || !groupId}>Review CSV</Button>
        </form>
      </Card>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {result?.anomalies ? (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Anomaly Review</h2>
              {result.session?.status ? <p className="text-sm text-muted-foreground">Status: {result.session.status}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={downloadReport}>Download Report</Button>
              {result.session?.status === "PENDING_REVIEW" ? (
                <>
                  <Button variant="secondary" onClick={reject}>Reject</Button>
                  <Button onClick={confirm}>Confirm Import</Button>
                </>
              ) : null}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Row</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {result.anomalies.map((item) => (
                  <tr key={item.id || `${item.rowNumber}-${item.anomalyType}`} className="border-b">
                    <td className="py-2">{item.rowNumber}</td>
                    <td>{item.anomalyType}</td>
                    <td>{item.anomalyDescription}</td>
                    <td>{item.actionTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
