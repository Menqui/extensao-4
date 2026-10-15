import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";

interface ConteudoMatematicoProps {
  texto: string;
}

export default function ConteudoMatematico({
  texto,
}: ConteudoMatematicoProps) {
  return (
    <Markdown
      skipHtml
      remarkPlugins={[remarkMath]}
      rehypePlugins={[
        [
          rehypeKatex,
          {
            output: "htmlAndMathml",
            trust: false,
          },
        ],
      ]}
    >
      {texto}
    </Markdown>
  );
}