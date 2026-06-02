import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import { Prism as SyntaxHighlighter }
  from "react-syntax-highlighter";

import { oneDark }
  from "react-syntax-highlighter/dist/esm/styles/prism";

export default function MarkdownRenderer({ content }) {

  return (

    <ReactMarkdown

      remarkPlugins={[remarkGfm]}

      components={{

        code({

          inline,

          className,

          children,

          ...props

        }) {

          const match = /language-(\w+)/.exec(
            className || ""
          );

          return !inline && match ? (

            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>

          ) : (

            <code
              className="bg-gray-200 px-1 rounded"
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}