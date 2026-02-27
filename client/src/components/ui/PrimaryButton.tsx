import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "filled" | "outlined";
}

export default function PrimaryButton({
  children,
  variant = "filled",
  className = "",
  ...props
}: PrimaryButtonProps) {
  const base =
    "rounded-lg px-6 py-2.5 font-semibold text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "filled"
      ? "bg-primary-600 text-white hover:bg-primary-700"
      : "border-2 border-primary-600 text-primary-600 hover:bg-primary-50";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
