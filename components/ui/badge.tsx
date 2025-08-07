import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "destructive" | "outline";
}

export function Badge({ className = "", variant = "outline", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium";

  const variants = {
    success: "bg-green-100 text-green-800 border border-green-300",
    destructive: "bg-red-100 text-red-800 border border-red-300",
    outline: "bg-gray-100 text-gray-800 border border-gray-300",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
