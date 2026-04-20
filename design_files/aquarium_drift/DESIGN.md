# Design System: The Submerged Sanctuary

## 1. Overview & Creative North Star
This design system is built upon the Creative North Star of **"The Submerged Sanctuary."** We are moving away from the rigid, clinical structures of traditional social media and toward an experience that feels fluid, organic, and deeply tactile. 

The goal is to evoke the sensation of looking into a high-end, rimless aquascape: clear, serene, and full of depth. We achieve this through **"Organic Editorialism"**—a layout philosophy that prioritizes breathing room, intentional asymmetry, and soft, overlapping layers. By rejecting harsh dividers and high-contrast containment, we create a digital environment that feels as welcoming as a hobbyist’s living room.

---

## 2. Colors & Surface Architecture
The palette is a sophisticated blend of sun-bleached sands and oxygenated waters. Our primary objective is to maintain a "warm" profile, even within the cool blue and green ranges.

### The "No-Line" Rule
To achieve a premium editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through tonal shifts or negative space. 
- Use `surface-container-low` (#fbfaee) to define a section against the main `surface` (#fefcf1).
- Use `surface-container-highest` (#eae9db) to draw the eye to interactive sidebars or navigation elements.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of organic material. 
- **The Base:** Everything sits on `surface` (#fefcf1).
- **The Nest:** A large media feed might sit on a `surface-container` (#f6f4e7) track.
- **The Object:** Individual cards or comments use `surface-container-lowest` (#ffffff) to "float" to the top of the visual stack.

### The "Glass & Gradient" Rule
Flat buttons are too "techy" for this community. 
- **Signature CTAs:** Use a subtle linear gradient from `primary` (#13715e) to `primary-container` (#9aedd4) at a 135-degree angle. This adds a "shimmer" effect reminiscent of light hitting water.
- **Floating Elements:** For navigation bars or top-level overlays, use a semi-transparent `surface-container-lowest` with a `backdrop-blur` of 20px. This allows the vibrant colors of aquarium photography to bleed through the UI, softening the interface.

---

## 3. Typography
We utilize **Plus Jakarta Sans** for its unique balance of geometric precision and soft, humanist terminals. It feels modern but approachable.

- **Display Scale (`display-lg` to `display-sm`):** Reserved for "Moment" headers (e.g., a user's "Tank of the Month" title). Use these with generous leading (1.1) to create an editorial magazine feel.
- **Headline & Title:** Use `headline-md` for community names and `title-lg` for post titles. These should always be set in `on-surface` (#383831) to maintain high legibility against the cream backgrounds.
- **Body & Labels:** `body-lg` is our workhorse for social captions. To prevent the "wall of text" feel, use `on-surface-variant` (#65655c) for secondary metadata like timestamps or view counts.

---

## 4. Elevation & Depth
In this system, depth is a product of light and layering, not artificial structure.

- **The Layering Principle:** Rather than shadows, use the **Tonal Lift**. A `surface-container-lowest` card placed on a `surface-container-high` background provides a natural, sophisticated elevation.
- **Ambient Shadows:** When a card requires a "floating" state (e.g., a hovered post), use an extra-diffused shadow:
  - `box-shadow: 0 20px 40px rgba(56, 56, 49, 0.06);` 
  - The shadow color is a 6% opacity tint of `on-surface`, never pure black or grey.
- **The "Ghost Border" Fallback:** If an element (like an image) risks bleeding into the background, apply a 1px border using `outline-variant` (#bbbab0) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Media Cards (The System Hero)
- **Geometry:** Use `lg` (2rem) corner radius. 
- **Content:** Images should be edge-to-edge at the top, with a "soft-bleed" transition into the content area. 
- **Interaction:** No dividers between the image, caption, and comments. Use `md` (1.5rem) vertical spacing to separate content blocks.

### Buttons
- **Primary:** Fully rounded (`full` / 9999px). Uses the Signature Gradient. Text is `on-primary` (#ffffff).
- **Secondary:** Surface-colored with a `surface-tint` (#13715e) text. No border—use a subtle `surface-container-high` background to define the hit area.
- **Tertiary:** Purely typographic with an icon. High-end social actions (Like/Share) should feel lightweight.

### Chips & Tags
- Use `secondary-container` (#9ae1ff) for category tags (e.g., "Freshwater," "Saltwater"). 
- Radius must be `full` to maintain the "pebble" aesthetic.

### Input Fields
- Avoid "box" inputs. Use a "Sunken" aesthetic: `surface-container-high` background with a `sm` (0.5rem) radius.
- On focus, the background shifts to `surface-container-lowest` with a subtle `primary` ghost-border (20% opacity).

---

## 6. Do's and Don'ts

### Do:
- **Use Asymmetry:** In large displays, offset your text to one side to create an editorial "white space" luxury.
- **Embrace the Cream:** Use `surface` (#fefcf1) as your primary negative space. It feels "living" and "warm" compared to #ffffff.
- **Soft Icons:** Use rounded icon sets (e.g., Material Symbols Rounded) with a 1.5pt to 2pt stroke weight to match the typography.

### Don't:
- **Don't use Dividers:** Never use a `<hr>` or a 1px line to separate comments. Use a 12px or 16px gap instead.
- **Don't use Pure Black:** Even for text, the darkest we go is `on-surface` (#383831). This maintains the "warm" hobbyist feel.
- **Don't use Sharp Corners:** Even for small elements like checkboxes, use at least `sm` (0.5rem) rounding. Sharp corners break the "Submerged Sanctuary" immersion.
- **Don't Over-Shadow:** If more than three elements on a screen have shadows, the UI becomes "noisy." Lean on tonal layering first.