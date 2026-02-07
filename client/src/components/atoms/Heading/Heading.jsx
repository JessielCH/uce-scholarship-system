import React from "react";

/**
 * ATOM: Heading
 */
const Heading = ({
  children,
  level = "h2",
  size = "lg",
  className = "",
  ...props
}) => {
  const sizeStyles = {
    sm: "text-lg font-semibold",
    md: "text-xl font-bold",
    lg: "text-2xl font-bold",
    xl: "text-3xl font-bold tracking-tight",
  };

  const HeadingTag = level;

  return (
    <HeadingTag
      className={`text-gray-900 ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </HeadingTag>
  );
};

export default Heading;
