

import { join } from "https://deno.land/std@0.177.0/path/mod.ts";
import postcss from "npm:postcss@8.5.1";
import tailwindcss from "npm:tailwindcss@3.4.17";

// Read your CSS file
const css = await Deno.readTextFile(join(Deno.cwd(), "src", "index.css"));

// Process the CSS with Tailwind
const result = await postcss([tailwindcss]).process(css, {
  from: join(Deno.cwd(), "src", "input.css"),
  to: join(Deno.cwd(), "dist", "output.css"),
});

// Write the processed CSS to a file
await Deno.writeTextFile(join(Deno.cwd(), "dist", "output.css"), result.css);

console.log("Tailwind CSS processed successfully!");