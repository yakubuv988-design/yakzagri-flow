"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Share2 } from "lucide-react";
import { Modal, ModalTrigger, ModalContent } from "@/components/ui/Modal";
import * as Dialog from "@radix-ui/react-dialog";

const WEB_ORIGIN = "https://amanavault.app";
import { t } from "@/lib/i18n";

export function buildReputationUrl(address: string, origin: string = WEB_ORIGIN): string {
  return `${origin}/reputation/${encodeURIComponent(address)}`;
}

export function ShareReputationButton({ address }: { address: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const url = buildReputationUrl(address);
  const text = encodeURIComponent(t("ui.share_message"));
  const encodedUrl = encodeURIComponent(url);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: 240 })
      .then((d) => {
        if (!cancelled) setQr(d);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const linkCls =
    "rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary hover:bg-elevated";

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary hover:bg-elevated"
        >
          <Share2 size={16} aria-hidden="true" /> {t("ui.share_reputation_profile")}
        </button>
      </ModalTrigger>
      <ModalContent className="p-6" mobileFullScreen={false}>
        <Dialog.Title className="text-lg font-semibold text-text-primary">
          {t("ui.share_reputation_profile")}
        </Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-text-secondary">
          {t("ui.share_reputation_description")}
        </Dialog.Description>
        <div className="mt-4 flex gap-2">
          <input
            readOnly
            value={url}
            aria-label={t("ui.share_profile_url")}
            className="min-w-0 flex-1 rounded-lg border border-border-default bg-bg-card px-3 py-2 font-mono text-xs text-text-primary"
          />
          <button type="button" onClick={copy} className={linkCls}>
            {copied ? t("ui.share_copied") : t("ui.share_copy_link")}
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={t("ui.share_qr_alt")} width={240} height={240} />
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          <a
            className={linkCls}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`}
          >
            {t("ui.share_on_twitter")}
          </a>
          <a
            className={linkCls}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://wa.me/?text=${text}%20${encodedUrl}`}
          >
            {t("ui.share_on_whatsapp")}
          </a>
        </div>
      </ModalContent>
    </Modal>
  );
}
