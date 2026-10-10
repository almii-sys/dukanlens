import React from "react";

/** Full-screen centered spinner used while a page's data loads. */
export function PageLoader() {
  return (
    <div className="nig-loader">
      <div className="nig-spinner" aria-label="Loading" role="status" />
    </div>
  );
}
