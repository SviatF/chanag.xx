import type {ReactNode} from "react";

type Props={
  title?:string;
  children:ReactNode;
  lang?:string;
};

/**
 * Deprecated public disclosure shell.
 *
 * PATCH 1 removes repeated methodology/disclaimer blocks from rendered content.
 * Route-level calculation facts now belong in the page's primary content when
 * they add user value. Existing imports can be removed gradually without
 * risking a large cross-route refactor in one deploy.
 */
export default function MethodologyNote(_props:Props){
  return null;
}
