"use client";

import React from "react";

export function SuccessPageWrapper({ 
  pageProps, 
  children 
}: { 
  pageProps: { creditsBalance: number },
  children: React.ReactNode 
}) {
  // Create a clone of the children with props
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, pageProps);
    }
    return child;
  });
} 