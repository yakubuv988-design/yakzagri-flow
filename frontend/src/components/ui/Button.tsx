"use client";

import React from "react";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  /**
   * Accessible name for icon-only buttons. Required when the button renders
   * only an icon (no visible text) so screen reader users get a description.
   * Also surfaced as a native tooltip for sighted users.
   */
  "aria-label"?: string;
}

function hasVisibleText(children: React.ReactNode): boolean {
  if (children === null || children === undefined || typeof children === "boolean") {
    return false;
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children).trim().length > 0;
  }
  if (Array.isArray(children)) {
    return children.some(hasVisibleText);
  }
  if (React.isValidElement(children)) {
    const childProps = children.props as { children?: React.ReactNode };
    return hasVisibleText(childProps?.children);
  }
  return false;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    className = "",
    children,
    title,
    ...props
  }: ButtonProps,
  ref,
) {
  const baseStyles = "font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-gold text-text-inverse hover:bg-gold-hover",
    secondary: "bg-bg-elevated text-text-primary border border-border-default hover:border-border-hover",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-sm rounded-lg",
  };

  const ariaLabel = props["aria-label"];
  const isIconOnly = !hasVisibleText(children);

  if (process.env.NODE_ENV !== "production" && isIconOnly && !ariaLabel) {
    console.warn(
      "[Button] Icon-only buttons must include a descriptive `aria-label` (e.g. 'Refresh balances', 'Copy address').",
    );
  }

  // For icon-only buttons, mirror the accessible name as a native tooltip so
  // sighted users get the same description on hover.
  const resolvedTitle = title ?? (isIconOnly ? ariaLabel : undefined);

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      title={resolvedTitle}
      {...props}
    >
      {children}
    </button>
  );
});
