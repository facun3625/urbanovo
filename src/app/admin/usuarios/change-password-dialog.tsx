"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminTheme } from "@/components/admin/admin-theme-root";
import { setUserPassword } from "./actions";

export function ChangePasswordButton({ id, label }: { id: string; label: string }) {
  const { containerRef } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError("");
      setShowPassword(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setError("");
    start(async () => {
      const result = await setUserPassword(id, password);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.success("Contraseña cambiada");
      handleOpenChange(false);
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Contraseña
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent container={containerRef}>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
            <p className="text-sm text-muted-foreground">
              Nueva contraseña para <span className="font-medium text-foreground">{label}</span>.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor={`pw-${id}`}>Contraseña nueva</Label>
              <div className="relative">
                <Input
                  id={`pw-${id}`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`pw2-${id}`}>Repetir contraseña</Label>
              <Input
                id={`pw2-${id}`}
                name="confirm"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando…" : "Guardar contraseña"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
