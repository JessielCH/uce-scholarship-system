import React from "react";

/**
 * ATOM: Button
 */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  className = "",
  ...props
}) => {
  const baseStyles =
    "font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2";

  const variantStyles = {
    primary: "bg-brand-blue text-white hover:bg-blue-800 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-800 focus:ring-red-500",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300 border border-gray-300",
  };

  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const buttonClass = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
    disabled || isLoading ? "opacity-60 cursor-not-allowed" : ""
  } ${className}`;

  return (
    <button disabled={disabled || isLoading} className={buttonClass} {...props}>
      {isLoading && (
        <span className="animate-spin">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      {Icon && !isLoading && <Icon size={20} />}
      {children}
    </button>
  );
};

export default Button;
