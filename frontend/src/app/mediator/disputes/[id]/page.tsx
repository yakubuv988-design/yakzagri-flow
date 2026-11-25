import dynamic from "next/dynamic";
import { ManifestComparison } from "@/components/mediator/ManifestComparison";
import { MediatorScratchpad } from "@/components/mediator/MediatorScratchpad";

const MediatorPanelClient = dynamic(() => import("./MediatorPanelClient"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground"
    >
      Loading dispute panel…
    </div>
  ),
});

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <MediatorPanelClient disputeId={id} />
      <div className="px-6 pb-8 max-w-6xl mx-auto">
        {/* TODO: wire to backend once a dispatch/delivery report endpoint exists. */}
        <ManifestComparison dispatch={null} delivery={null} />
      </div>
    </>
  );
}
      <MediatorScratchpad disputeId={id} />
    </>
  );
}
