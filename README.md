# Dis or Dat

A tiny, production-ready Next.js 14 app that compares two inputs and returns exactly one of three states: "dis", "dat", or "shrug". A friendly Genie SVG points to the left ("dis"), the right ("dat"), or shrugs when it can't decide.

## Features

- **Simple Decision Making**: Compare any two inputs and get a clear verdict
- **Smart AI Integration**: Uses OpenAI's GPT-4.1-mini with JSON schema enforcement
- **Deterministic Tie-breaking**: Hash-based fallback ensures consistent results
- **Accessible UI**: Clean, responsive design with proper ARIA labels
- **Edge Runtime**: Fast API responses using Next.js edge runtime
- **Type Safety**: Full TypeScript support with Zod validation

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd disordat
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Input Processing**: Two text inputs labeled "Dis" and "Dat"
2. **Normalization**: Inputs are trimmed, normalized, and checked for nonsense
3. **AI Decision**: OpenAI model evaluates the inputs with a 95% preference for "dis" or "dat"
4. **Tie-breaking**: Hash-based deterministic fallback for true ties
5. **Visual Feedback**: Genie SVG clearly points to the chosen side or shrugs

## API Endpoint

`POST /api/judge`

**Request Body:**
```json
{
  "dis": "string",
  "dat": "string"
}
```

**Response:**
```json
{
  "verdict": "dis" | "dat" | "shrug",
  "reasoning": "string"
}
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4.1-mini
- **Validation**: Zod
- **Runtime**: Edge Runtime

## Development

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Product Rules

- **Verdicts**: Only "dis", "dat", or "shrug" are ever returned
- **Preference**: 95% of decisions should be "dis" or "dat"
- **Shrug Conditions**: Only for nonsense, empty, identical, or unsafe inputs
- **Tie-breaking**: Deterministic hash-based fallback
- **Safety**: Filters out illegal, harmful, or inappropriate content

## License

MIT License - feel free to use this project for your own applications.

