import type {CSSProperties,ReactNode} from "react";

type Props={
  title?:string;
  children:ReactNode;
  lang?:string;
};

const shell:CSSProperties={
  maxWidth:900,
  margin:"42px 0 8px",
  padding:"18px 0 0",
  borderTop:"1px solid rgba(148,146,137,.24)",
  color:"#8f918a",
  fontSize:12,
  lineHeight:1.7,
  background:"transparent",
};
const heading:CSSProperties={margin:"0 0 7px",color:"#aaa99f",fontSize:13,fontWeight:500,letterSpacing:".02em"};
const body:CSSProperties={margin:0};

export default function MethodologyNote({title="How this is calculated",children,lang}:Props){
  return <section className="methodology-note" data-methodology-disclosure="true" aria-label={title} lang={lang} style={shell}>
    <h2 style={heading}>{title}</h2>
    <div className="methodology-note-body" style={body}>{children}</div>
  </section>;
}
