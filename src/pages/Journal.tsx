import { AppLayout } from "@/components/AppLayout";

export default function Journal() {
  return (
    <AppLayout title="Journal Comptable">
      <div className="rounded-md border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Le module journal sera implémenté dans la Phase 3.
        </p>
      </div>
    </AppLayout>
  );
}
