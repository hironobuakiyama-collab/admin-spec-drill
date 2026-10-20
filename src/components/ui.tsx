import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { href } from "@/lib/router";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

const BUTTON: Record<ButtonVariant, string> = {
  primary: "bg-btn text-onBtn hover:bg-btnHover disabled:bg-line disabled:text-muted",
  outline: "border-2 border-brand text-brandText bg-surface hover:bg-brandSoft disabled:opacity-50",
  ghost: "text-brandText hover:bg-brandSoft disabled:opacity-50",
  danger: "bg-ng text-surface hover:opacity-90 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  block,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; block?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 font-bold transition disabled:cursor-not-allowed",
        BUTTON[variant],
        block && "w-full",
        className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("bg-surface border border-line rounded-lg", className)}>{children}</section>;
}

type BadgeTone = "muted" | "brand" | "ok" | "ng" | "warn";

const BADGE: Record<BadgeTone, string> = {
  muted: "bg-surface2 text-muted",
  brand: "bg-brandSoft text-brandText",
  ok: "bg-okSoft text-ok",
  ng: "bg-ngSoft text-ng",
  warn: "bg-warnSoft text-warn",
};

export function Badge({ tone = "muted", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded", BADGE[tone], className)}>{children}</span>;
}

export function ProgressBar({ value, tone = "brand", marker }: { value: number; tone?: "brand" | "ok" | "ng"; marker?: number }) {
  const color = tone === "ok" ? "bg-ok" : tone === "ng" ? "bg-ng" : "bg-brand";
  return (
    <div className="relative h-2 rounded-full bg-surface2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full transition-all", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      {marker !== undefined && <div className="absolute inset-y-0 w-0.5 bg-fg" style={{ left: `${marker}%` }} />}
    </div>
  );
}

/** 画面上部の帯。トップ以外は戻るリンクを出す */
export function PageHeader({ title, sub, back = "", right }: { title: string; sub?: string; back?: string | false; right?: ReactNode }) {
  return (
    <header className="bg-band text-onBand">
      <div className="gutter">
        <div className="max-w-2xl mx-auto py-3 flex items-center gap-2 min-h-[56px]">
          {back !== false && (
            <a href={href(back)} className="-ml-2 p-2 rounded-md hover:bg-btnHover" aria-label="戻る">
              <ChevronLeft className="w-5 h-5" />
            </a>
          )}
          <div className="min-w-0 flex-1">
            {sub && <p className="text-[11px] eyebrow opacity-80 truncate">{sub}</p>}
            <h1 className="text-base font-bold leading-tight truncate">{title}</h1>
          </div>
          {right}
        </div>
      </div>
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="gutter">
      <div className="max-w-2xl mx-auto py-5 flex flex-col gap-4">{children}</div>
    </main>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-bold eyebrow text-brandText">{children}</h2>;
}

export function Stat({ label, value, unit, note }: { label: string; value: ReactNode; unit?: string; note?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-black tnum text-fg leading-tight">
        {value}
        {unit && <span className="text-sm font-bold text-muted ml-0.5">{unit}</span>}
      </p>
      {note && <p className="text-[11px] text-muted">{note}</p>}
    </div>
  );
}
