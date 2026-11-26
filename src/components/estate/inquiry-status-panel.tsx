"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CopyIcon, ExternalLinkIcon, HouseIcon, MailIcon, PhoneIcon, Trash2, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/confirm-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toWhatsAppLink } from "@/lib/social-links";
import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { consultaStatusBadgeClass, labels } from "@/lib/estate/modules";
import { INQUIRY_STATUSES } from "@/lib/estate/inquiry-status";
import { deleteEstateInquiry, setEstateInquiryStatus } from "@/app/admin/gestion/actions";

export type InquiryStatusEvent = {
  id: string;
  status: string;
  changedByName: string;
  // Ya formateada en el servidor: formatearla acá daba un texto distinto
  // al del render del servidor (Node y el navegador no escriben igual
  // "a. m.") y React se quejaba de hydration mismatch.
  when: string;
};

// Estado de la consulta con cambio en un clic, historial de quién hizo cada
// cambio y eliminar.
export function InquiryStatusPanel({
  id,
  status,
  createdAt,
  history,
  closeHref,
  contact = null,
  property = null,
  mailHref = null,
}: {
  id: string;
  status: string;
  createdAt: string;
  history: InquiryStatusEvent[];
  closeHref: string;
  // Datos de la persona que consultó, a mano para llamarla o escribirle.
  contact?: { id: string; name: string; email: string | null; phone: string | null } | null;
  // Propiedad consultada: se abre en otra pestaña.
  property?: { id: string; code: string; title: string } | null;
  // Atajo al armado de mail con el cliente (y la propiedad) ya cargados.
  mailHref?: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  function changeStatus(next: string) {
    if (next === status) return;
    startTransition(async () => {
      const result = await setEstateInquiryStatus(id, next);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Marcada como ${labels[next]?.toLowerCase() ?? next}`);
      router.refresh();
    });
  }

  async function remove() {
    const accepted = await confirm({
      title: "Eliminar consulta",
      description: "La consulta y su historial se borran definitivamente. El contacto no se elimina.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!accepted) return;
    startTransition(async () => {
      const result = await deleteEstateInquiry(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Consulta eliminada");
      router.push(closeHref);
      router.refresh();
    });
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copiado"),
      () => toast.error("No se pudo copiar"),
    );
  }

  return (
    <div className="mb-6 space-y-4 rounded-xl border bg-muted/30 p-4">
      {contact && (
        <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1 text-sm">
            <Link
              href={`/admin/gestion/clientes/${contact.id}`}
              className="flex items-center gap-1.5 font-semibold hover:underline"
            >
              <UserRoundIcon className="size-4 text-muted-foreground" />
              {contact.name}
            </Link>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              {contact.email ? (
                <button type="button" onClick={() => copy(contact.email!)} className="flex items-center gap-1.5 hover:text-foreground" title="Copiar mail">
                  <MailIcon className="size-3.5" />
                  <span className="select-all">{contact.email}</span>
                  <CopyIcon className="size-3 opacity-60" />
                </button>
              ) : (
                <span className="flex items-center gap-1.5"><MailIcon className="size-3.5" />Sin mail</span>
              )}
              {contact.phone ? (
                <button type="button" onClick={() => copy(contact.phone!)} className="flex items-center gap-1.5 hover:text-foreground" title="Copiar teléfono">
                  <PhoneIcon className="size-3.5" />
                  <span className="select-all">{contact.phone}</span>
                  <CopyIcon className="size-3 opacity-60" />
                </button>
              ) : (
                <span className="flex items-center gap-1.5"><PhoneIcon className="size-3.5" />Sin teléfono</span>
              )}
            </div>
            {property && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                  <HouseIcon className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {property.code} · {property.title}
                  </span>
                </span>
                <a
                  href={`/propiedades/${property.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Ver en la web <ExternalLinkIcon className="size-3" />
                </a>
                <a
                  href={`/admin/gestion/propiedades/${property.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Ficha en el admin <ExternalLinkIcon className="size-3" />
                </a>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.phone && (
              <>
                <Button size="sm" variant="outline" render={<a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} />}>
                  <PhoneIcon className="size-3.5" />
                  Llamar
                </Button>
                <Button
                  size="sm"
                  className="bg-[#25D366] text-white hover:bg-[#25D366]/90"
                  render={<a href={toWhatsAppLink(contact.phone)} target="_blank" rel="noreferrer" />}
                >
                  <WhatsAppIcon className="size-3.5" />
                  WhatsApp
                </Button>
              </>
            )}
            {contact.email && (
              <Button size="sm" variant="outline" render={<a href={`mailto:${contact.email}`} />}>
                <MailIcon className="size-3.5" />
                Mail directo
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Estado de la consulta">
          {INQUIRY_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              aria-pressed={s === status}
              onClick={() => changeStatus(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                s === status
                  ? cn(consultaStatusBadgeClass(s), "border-current")
                  : "bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {labels[s] ?? s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {mailHref && (
            <Button size="sm" variant="outline" render={<Link href={mailHref} />}>
              <MailIcon className="size-3.5" />
              Responder por mail
            </Button>
          )}
          <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={remove}>
            <Trash2 className="size-3.5" />
            Eliminar
          </Button>
        </div>
      </div>

      <ol className="space-y-1.5 text-xs text-muted-foreground">
        {[...history].reverse().map((event) => (
          <li key={event.id}>
            <span className="font-medium text-foreground">{labels[event.status] ?? event.status}</span>
            {" · "}
            {event.changedByName} · {event.when}
          </li>
        ))}
        <li>
          <span className="font-medium text-foreground">Ingresada</span> ·{" "}
          {createdAt}
        </li>
      </ol>
    </div>
  );
}
