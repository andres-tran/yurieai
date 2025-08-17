export function AppInfoContent() {
  return (
    <div className="space-y-4">
      <p className="text-foreground leading-relaxed">
        <span className="font-medium">Yurie</span> is the open-source chat
        interface.
        <br />
        Use OpenAI models with a clean, fast UI.
        <br />
        Open-source and self-hostable.
        <br />
      </p>
      <p className="text-foreground leading-relaxed">
        Visit {""}
        <a
          href="https://yurie.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          yurie.ai
        </a>
        .
      </p>
      <p className="text-foreground leading-relaxed">
        The code is available on{" "}
        <a
          href="https://github.com/andres-tran/yurieai"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GitHub
        </a>
        .
      </p>
    </div>
  )
}
