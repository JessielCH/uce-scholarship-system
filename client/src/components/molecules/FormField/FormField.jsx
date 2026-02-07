import React from "react";
import Input from "../../atoms/Input";
import { AlertCircle } from "lucide-react";

/**
 * MOLECULE: FormField
 */
const FormField = ({
  label,
  name,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error,
  touched,
  icon: Icon = null,
  helperText = null,
  required = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        error={hasError}
        icon={Icon}
        disabled={disabled}
        {...props}
      />
      {hasError && (
        <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      {helperText && !hasError && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default FormField;
