# Yurie

[yurie.ai](https://yurie.ai)

**Yurie** is the open-source chat interface for all your models.

![yurie cover](./public/cover_yurie.jpg)

## Features

- OpenAI models only
- Inline image uploads
- Clean, responsive UI with light/dark themes
- Built with Tailwind CSS, shadcn/ui, and prompt-kit
- Open-source and self-hostable
- Customizable: user system prompt, multiple layout options
- Full MCP support (wip)

## Quick Start

```bash
git clone https://github.com/andres-tran/yurieai.git
cd yurieai
npm install
echo "OPENAI_API_KEY=your-key" > .env.local
npm run dev
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/andres-tran/yurieai)


## Built with

- [prompt-kit](https://prompt-kit.com/) — AI components
- [shadcn/ui](https://ui.shadcn.com) — core components
- [motion-primitives](https://motion-primitives.com) — animated components
- [vercel ai sdk](https://vercel.com/blog/introducing-the-vercel-ai-sdk) — model integration, AI features