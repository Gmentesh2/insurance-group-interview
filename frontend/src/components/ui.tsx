"use client";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
import { LoaderCircle, CircleAlert, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...values: Parameters<typeof clsx>) {
  return twMerge(clsx(values));
}
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
  }
>(function Button(
  { className, variant = "primary", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "button",
        variant !== "primary" && `button-${variant}`,
        className,
      )}
      {...props}
    />
  );
});
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("input", className)} {...props} />;
});
export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("label", className)} {...props} />;
}
export function Spinner() {
  return <LoaderCircle className="spinner" size={20} aria-hidden="true" />;
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "error" | "info" | "success" | "warning";
}) {
  const Icon = {
    error: CircleAlert,
    info: Info,
    success: CheckCircle2,
    warning: TriangleAlert,
  }[tone];
  return (
    <div
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={20} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function IconSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("icon-surface", className)} aria-hidden="true">
      {children}
    </span>
  );
}
export function Badge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "error" | "info" | "success" | "warning" | "neutral";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && (
          <p className="muted intro-description">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
export { TripSummary } from "./trip-summary";
