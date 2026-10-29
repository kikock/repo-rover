import React from "react";

interface ActionToastProps {
  message: string | null;
}

export const ActionToast: React.FC<ActionToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="global-toast-capsule">
      <span style={{ fontSize: "16px" }}>🔔</span>
      <span>{message}</span>
    </div>
  );
};
