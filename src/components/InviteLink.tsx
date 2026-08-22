"use client";
import { useState, useTransition } from "react";
import { getInviteLink } from "@/lib/actions";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Copy a known invite URL (shown right after inviting). */
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copy(url)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
      className="btn btn-ghost text-xs shrink-0"
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}

/** Fetch (or generate) an invited client's sign-up link, then copy it. */
export function ClientInviteLinkButton({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await getInviteLink(clientId);
            if (res.ok && res.url) {
              setUrl(res.url);
              setMsg((await copy(res.url)) ? "Link copied — paste it to your client (e.g. WhatsApp)." : "Link ready below.");
            } else {
              setMsg(res.message ?? "Could not get the link.");
            }
          })
        }
        className="btn btn-primary text-sm"
      >
        {pending ? "Getting link…" : "Copy invite link"}
      </button>
      {msg && <p className="mt-2 text-xs text-fg-muted">{msg}</p>}
      {url && (
        <p className="mt-1 break-all rounded-md border border-line bg-surface/40 p-2 text-[11px] text-fg-muted select-all">{url}</p>
      )}
    </div>
  );
}
