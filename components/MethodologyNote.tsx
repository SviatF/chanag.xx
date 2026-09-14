import type {ReactNode} from "react";

type Props={
  title?:string;
  children:ReactNode;
  lang?:string;
};

export default function MethodologyNote({title="How this is calculated",children,lang}:Props){
  return <section className="methodology-note" data-methodology-disclosure="true" aria-label={title} lang={lang}>
    <h2>{title}</h2>
    <div className="methodology-note-body">{children}</div>
  </section>;
}
