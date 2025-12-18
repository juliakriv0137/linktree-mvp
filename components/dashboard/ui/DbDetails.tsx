import * as React from "react";
import clsx from "clsx";

export type DbDetailsProps = React.DetailsHTMLAttributes<HTMLDetailsElement>;

export function DbDetails({ className, ...props }: DbDetailsProps) {
  return <details className={clsx("relative", className)} {...props} />;
}
