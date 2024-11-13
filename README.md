<a href="https://www.aigenlogo.io">
  <img alt="AI Logo Generator" src="./public/og-image.png">
  <h1 align="center">AI Logo Generator</h1>
</a>

<p align="center">
  An open source AI-powered logo generator – create professional logos in seconds with customizable styles. Powered by Together.ai & Flux.
</p>

## Tech stack

- [Together AI](https://www.together.ai/) for AI infrastructure
- [Flux](https://api.together.ai/signin?redirectUrl=/playground/image/black-forest-labs/FLUX.1.1-pro) for logo generation
- [Next.js](https://nextjs.org/) with TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn/ui](https://ui.shadcn.com/) for UI components
- React 18 with hooks

## Cloning & running

1. Clone the repo: `git clone https://github.com/Reda-Darbal/logo-maker-v2`
2. Create a `.env` file and add your [Together AI API key](https://www.together.ai/): `TOGETHER_API_KEY=`
3. Run `npm install` and `npm run dev` to install dependencies and run locally.

## Future Tasks

- [ ] Implement A/B testing for different logo variations
- [ ] Add export options for different use cases (social media, print, etc.)
- [ ] Create a marketplace for custom logo elements
- [ ] Implement automatic brand guidelines generation
- [ ] Add performance optimizations for faster generation
- [ ] Create a version history system
- [ ] Add accessibility improvements
- [ ] Implement better error handling and user feedback
- [ ] Add support for custom fonts
- [ ] Create documentation for API integration
