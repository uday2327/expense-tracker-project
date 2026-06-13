import { AppShell } from "@/components/AppShell";
import { ImportUploader } from "@/components/ImportUploader";

export default async function ImportPage({ searchParams }) {
  const params = await searchParams;

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">CSV Import</h1>
      <ImportUploader defaultGroupId={params.groupId} />
    </AppShell>
  );
}

