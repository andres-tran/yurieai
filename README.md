# Zola

[zola.chat](https://zola.chat)

**Zola** is the open-source chat interface for all your models.

![zola cover](./public/cover_zola.jpg)

## Features

- OpenAI models only
- Inline image uploads
- Clean, responsive UI with light/dark themes
- Built with Tailwind CSS, shadcn/ui, and prompt-kit
- Open-source and self-hostable
- Customizable: user system prompt, multiple layout options
- Full MCP support (wip)

## Quick Start

### Option 1: With OpenAI (Cloud)

```bash
git clone https://github.com/ibelick/zola.git
cd zola
npm install
echo "OPENAI_API_KEY=your-key" > .env.local
npm run dev
```

docker-compose up
<!-- Ollama and BYOK removed -->

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ibelick/zola)

Auth has been removed in this fork. No database is required.

## Built with

- [prompt-kit](https://prompt-kit.com/) — AI components
- [shadcn/ui](https://ui.shadcn.com) — core components
- [motion-primitives](https://motion-primitives.com) — animated components
- [vercel ai sdk](https://vercel.com/blog/introducing-the-vercel-ai-sdk) — model integration, AI features
 

## Sponsors

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>

## License

Apache License 2.0

## Notes

This is a beta release. The codebase is evolving and may change.
