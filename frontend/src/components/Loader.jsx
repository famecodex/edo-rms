import React from "react";
export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-gray-500">
      <div className="w-6 h-6 rounded-full border-4 border-edoBlue border-t-transparent animate-spin" />
      <div>{text}</div>
    </div>
  );
}
