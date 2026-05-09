"use client";

/**
 * CopilotKitProviderShell — client-side wrapper around CopilotKitProvider.
 *
 * Why this lives in its own file: the provider's `renderToolCalls` config
 * carries non-plain values (zod schemas + component refs) that can't be
 * serialized across the server→client boundary if registered directly
 * inside the root server-component layout. Wrapping the provider in this
 * client component keeps the schema construction client-side, and the
 * server layout just renders <CopilotKitProviderShell>{children}</…>.
 *
 * Tool-call rendering registry:
 *   { name: "*", args: z.any(), render: ToolCallView }
 *
 * Catches every tool invocation that doesn't have its own dedicated
 * `useFrontendTool({ render })`. CopilotKit's resolver prefers exact-name
 * matches over the wildcard, so the bespoke render slots in page.tsx
 * (renderEmailDraft, renderEnrichmentStream, etc.) still take precedence.
 *
 * On routes that don't need CopilotKit (e.g. /sitesense), the provider
 * still mounts but won't cause errors as long as no CopilotKit hooks are
 * called. The runtime-info fetch errors in the console on those routes are
 * expected when the BFF is not running — they are harmless.
 */

import { z } from "zod";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ToolCallView } from "./ToolCallView";
import { usePathname } from "next/navigation";

const RENDER_TOOL_CALLS = [
  { name: "*", args: z.any(), render: ToolCallView },
];

// Routes that don't use CopilotKit — skip the provider to avoid
// spurious backend-connection errors in the console.
const COPILOTKIT_FREE_ROUTES = ["/sitesense"];

export function CopilotKitProviderShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const skip = COPILOTKIT_FREE_ROUTES.some((r) => pathname.startsWith(r));

  if (skip) {
    return <>{children}</>;
  }

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY}
      openGenerativeUI={{}}
      renderToolCalls={RENDER_TOOL_CALLS}
    >
      {children}
    </CopilotKitProvider>
  );
}
