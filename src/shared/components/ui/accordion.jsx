import * as React from "react";

export function Accordion({ children }) {
  return <div className="accordion">{children}</div>;
}

export function AccordionItem({ children }) {
  return <div className="accordion-item">{children}</div>;
}

export function AccordionTrigger({ children, ...props }) {
  return (
    <button className="accordion-trigger" {...props}>
      {children}
    </button>
  );
}

export function AccordionContent({ children }) {
  return <div className="accordion-content">{children}</div>;
}
