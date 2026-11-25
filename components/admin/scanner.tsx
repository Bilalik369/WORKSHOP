"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  CircleAlert,
  CircleCheckBig,
  Hourglass,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { checkIn, type CheckInResult } from "@/app/admin/actions";
import { formatTime, statutLabel } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormAlert, Input, Label } from "@/components/ui/form";

const RESULT_VIEW = {
  ok: { tone: "ok", icon: CircleCheckBig, title: "Présence enregistrée" },
  already: { tone: "warn", icon: TriangleAlert, title: "Déjà pointé" },
  waitlist: { tone: "warn", icon: Hourglass, title: "Sur liste d’attente — pas de place confirmée" },
  cancelled: { tone: "bad", icon: CircleAlert, title: "Réservation annulée" },
  not_found: { tone: "bad", icon: CircleAlert, title: "Billet inconnu" },
  error: { tone: "bad", icon: CircleAlert, title: "Erreur — réessayez" },
} as const;

const TONES = {
  ok: "border-mint bg-mint/15 text-mint-dark",
  warn: "border-amber-400 bg-amber-50 text-amber-900",
  bad: "border-rose-400 bg-rose-50 text-rose-800",
} as const;

/** Délai avant de pouvoir rescanner le même code (évite les doublons). */
const SAME_CODE_DELAY_MS = 5000;

/**
 * Pointage le jour J : scanne le QR code d'un billet avec la caméra du
 * téléphone, ou saisie manuelle du code en secours.
 */
export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);
  const busyRef = useRef(false);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [manual, setManual] = useState("");
  const [count, setCount] = useState(0);

  const submit = useCallback(async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || busyRef.current) return;
    busyRef.current = true;
    setChecking(true);
    try {
      const response = await checkIn(code);
      setResult(response);
      if (response.result === "ok") setCount((value) => value + 1);
      navigator.vibrate?.(response.result === "ok" ? 120 : [80, 60, 80]);
    } catch {
      setResult({ result: "error", code });
    } finally {
      setChecking(false);
      lastRef.current = { code, at: Date.now() };
      busyRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("La caméra n’est pas disponible sur cet appareil. Utilisez la saisie manuelle.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setActive(true);

      const canvas = (canvasRef.current ??= document.createElement("canvas"));
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      let lastScan = 0;

      const tick = (time: number) => {
        frameRef.current = requestAnimationFrame(tick);
        // ~8 analyses par seconde suffisent et ménagent la batterie.
        if (time - lastScan < 120 || busyRef.current || video.readyState < 2) return;
        lastScan = time;

        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(image.data, image.width, image.height, {
          inversionAttempts: "dontInvert",
        });
        const code = found?.data.trim().toUpperCase();
        if (!code) return;
        const last = lastRef.current;
        if (code === last.code && Date.now() - last.at < SAME_CODE_DELAY_MS) return;
        void submit(code);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError(
        "Accès à la caméra refusé. Autorisez la caméra pour ce site dans les réglages du navigateur, ou utilisez la saisie manuelle.",
      );
    }
  }, [submit]);

  useEffect(() => stop, [stop]);

  const view = result ? RESULT_VIEW[result.result] : null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-navy-deep shadow-lift">
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn("size-full object-cover", !active && "invisible")}
        />
        {active ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="size-[62%] rounded-3xl border-4 border-white/85 shadow-[0_0_0_100vmax_rgb(7_29_102/0.45)]" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <Camera aria-hidden="true" className="size-12 opacity-80" strokeWidth={1.4} />
            <p className="text-lg font-semibold">Scannez le QR code d’un billet</p>
            <Button type="button" variant="mint" size="lg" onClick={start}>
              Activer la caméra
            </Button>
          </div>
        )}
        {checking ? (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Vérification…
            </span>
          </div>
        ) : null}
      </div>

      {active ? (
        <Button type="button" variant="outline" size="sm" onClick={stop} className="self-center">
          <CameraOff aria-hidden="true" />
          Arrêter la caméra
        </Button>
      ) : null}

      {cameraError ? <FormAlert>{cameraError}</FormAlert> : null}

      <div aria-live="assertive">
        {result && view ? (
          <div className={cn("rounded-3xl border-2 p-5", TONES[view.tone])}>
            <p className="flex items-center gap-3 text-xl font-extrabold">
              <view.icon aria-hidden="true" className="size-7 shrink-0" />
              {view.title}
            </p>
            {result.name ? (
              <p className="mt-3 text-2xl font-extrabold text-navy" dir="auto">
                {result.name}
              </p>
            ) : null}
            <p className="mt-1 text-[0.95rem] font-medium text-ink">
              {[
                result.code,
                result.statut ? statutLabel(result.statut) : null,
                result.etablissement,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {result.result === "already" && result.checkedInAt ? (
              <p className="mt-1 font-semibold">Arrivée enregistrée à {formatTime(result.checkedInAt)}.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <form
        className="glass rounded-3xl p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(manual).then(() => setManual(""));
        }}
      >
        <Label htmlFor="manual-code">Saisie manuelle du code</Label>
        <div className="flex gap-2.5">
          <Input
            id="manual-code"
            value={manual}
            onChange={(event) => setManual(event.target.value.toUpperCase())}
            placeholder="IAE-XXXXXX"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            className="font-mono font-bold tracking-widest"
          />
          <Button type="submit" disabled={checking || manual.trim().length < 4}>
            Pointer
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-muted">
        {count} présence(s) enregistrée(s) depuis cet appareil pendant cette session.
      </p>
    </div>
  );
}
