# Yurie Installation Guide

Yurie is a free, open-source AI chat app using OpenAI models. This guide covers local development and production deployment.

![Yurie screenshot](./public/cover_yurie.jpg)

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

No authentication or database is required in this build.

### Recommended OpenAI Models

 - `gpt-5` — highest quality, best reasoning
 - `gpt-5-mini` — balanced quality/speed
 - `gpt-5-nano` — fastest and cheapest

## Local Installation

### macOS / Linux

```bash
# Clone the repository
git clone https://github.com/andres-tran/yurieai.git
cd yurieai

# Install dependencies
npm install

# Run the development server
npm run dev
```

### Windows

```bash
# Clone the repository
git clone https://github.com/andres-tran/yurieai.git
cd yurieai

# Install dependencies
npm install

# Run the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

 

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

## Community and Support

- GitHub Issues: Report bugs or request features
- GitHub Discussions: Ask questions and share ideas

## License

Apache License 2.0
