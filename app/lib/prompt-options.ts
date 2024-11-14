import dedent from "dedent";

const flashyStyle = dedent`
  The design should be flashy, attention grabbing, bold, and eye-catching.

  Use vibrant colors with metallic, shiny, and glossy accents. It should feel futuristic.

  Feel free to add in neon colors to make the logo pop.`;

const techStyle = dedent`
  The design should be similar to a tech company logo. Minimalist, clean, and sleek.

  The color palette should be neutral with subtle accents.

  Simple geometric shapes, clean lines, shadows, and flat.
  `;

const modernStyle = dedent`
  The design should be modern and forward-thinking while embracing flat design.

  Use geometric shapes and clean lines to create a balanced aesthetic.

  The colors should be natural with subtle accents.

  Feel free to use strategic negative space to create visual interest.`;

const playfulStyle = dedent`
  The design should be playful, lighthearted, and lively.

  Feel free to use bright bold colors with rounded shapes.`;

const abstractStyle = dedent`
  The design should be abstract, artistic, and creative.

  Use unique shapes, patterns, and textures to create a visually interesting and wild logo.`;

const minimalStyle = dedent`
  The design should be minimal and simple. It should be timeless and versatile.

  The logo only has a single color and makes use of negative space. Light, soft, and subtle.

  Use flat design with minimal details.`;

export const styleLookup: Record<string, string> = {
  Flashy: flashyStyle,
  Tech: techStyle,
  Modern: modernStyle,
  Playful: playfulStyle,
  Abstract: abstractStyle,
  Minimal: minimalStyle,
};

const soloLayout = dedent`
  Do not include any text in the logo`;

const sideLayout = dedent`
  Write the company name to the right of the logo. Keep the logo on the left. Ensure the text and icon are well-aligned for visual balance.`;

const stackLayout = dedent`
  Write the company name directly underneath the logo. Keep the logo on top. Ensure vertical alignment with equal emphasis on both text and symbol for a balanced, clean layout.`;

export const layoutLookup: Record<string, string> = {
  Solo: soloLayout,
  Side: sideLayout,
  Stack: stackLayout,
};
