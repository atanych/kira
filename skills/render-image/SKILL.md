# Render Image

## Description
Generates images from text prompts using Google's Imagen 4 API.

## Usage
```bash
node skills/render-image/render-image.mjs "<prompt>" --ratio <aspect_ratio> --size <size>
```

## Arguments
- `prompt` (required) — text description of the image to generate
- `--ratio` (required) — aspect ratio: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`
- `--size` (required) — resolution: `1K` or `2K`

## Input
- Requires `GOOGLE_AI_API_KEY` in `.env`

## Output
- Saves generated image as PNG to `output/` directory
- Prints the output file path to stdout
