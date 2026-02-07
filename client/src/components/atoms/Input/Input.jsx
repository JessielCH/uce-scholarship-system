import React from "react";

/**
 * ATOM: Input
 */
const Input = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  disabled = false,
  error = false,
  icon: Icon = null,
  className = "",
  ...props
}) => {
  const baseStyles =
    "w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all text-sm";

  const stateStyles = error
    ? "border-red-500 bg-red-50"
    : "border-gray-300 bg-white hover:border-gray-400";

  return (
    <div className="relative flex items-center">
      {Icon && (
        <Icon
          size={18}
          className="absolute left-3 text-gray-400 pointer-events-none"
        />
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${baseStyles} ${stateStyles} ${Icon ? "pl-10" : ""} ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
