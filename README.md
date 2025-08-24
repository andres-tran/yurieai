# Yurie

[yurie.ai](https://yurie.ai)

Yurie is a free, open-source AI chat app using OpenAI models. It’s clean, fast, and self-hostable.

## Features

- OpenAI models only
- Inline image uploads
- Clean, responsive UI with light/dark themes
- Built with Tailwind CSS, shadcn/ui, and prompt-kit
- Open-source and self-hostable
- Customizable: user system prompt, simple fullscreen layout

## Quick Start

```bash
git clone https://github.com/andres-tran/yurieai.git
cd yurieai
npm install
echo "OPENAI_API_KEY=your-key" > .env.local
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/andres-tran/yurieai)

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Git
- OpenAI API key

## Environment Setup

Create a `.env.local` file in the project root with at least:

```bash
OPENAI_API_KEY=your_openai_api_key
# Optional for production:
# NEXT_PUBLIC_APP_URL=your_production_url
# NEXT_PUBLIC_VERCEL_URL=your_vercel_domain
```

### Recommended OpenAI Models

- `gpt-5` — highest quality, best reasoning
- `gpt-5-mini` — balanced quality/speed
- `gpt-5-nano` — fastest and cheapest

These GPT-5 models also support image generation via the OpenAI Responses API using the `image_generation` tool.

## Production Deployment

### Deploy to Vercel

The easiest way to deploy Yurie is using Vercel:

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Import the project into Vercel
3. Configure your environment variables
4. Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Self-Hosted Production

For a self-hosted production environment, you'll need to build the application and run it:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Configuration Options

You can customize various aspects of Yurie by modifying the configuration files:

- `lib/config.ts`: Configure AI models, daily message limits, etc.
- `.env.local`: Set environment variables and API keys

## Troubleshooting

### Common Issues

1. **AI models not responding**
   - Verify your OpenAI API key is set and valid
   - Check that the selected model is available

## Built with

- [prompt-kit](https://prompt-kit.com/) — AI components
- [shadcn/ui](https://ui.shadcn.com) — core components
- [motion-primitives](https://motion-primitives.com) — animated components
- [vercel ai sdk](https://vercel.com/blog/introducing-the-vercel-ai-sdk) — model integration, AI features

## Community and Support

- GitHub Issues: Report bugs or request features
- GitHub Discussions: Ask questions and share ideas