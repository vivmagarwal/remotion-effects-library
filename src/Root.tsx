import React from 'react';
import {Composition, Folder} from 'remotion';
import {effects} from './registry.generated';
import {THEMES} from './theme';

/** Folder names may only contain letters, numbers and hyphens. */
const folderName = (category: string) =>
  category.replace(/[^A-Za-z0-9-]/g, '-');

/**
 * `REMOTION_THEME=console npx remotion render …` renders the whole library in a
 * different theme.
 *
 * Unset means no theme is passed at all, which is not the same as passing the
 * house one: each effect then uses its OWN inline default — the typeface and
 * accent it was authored with. That is what you get from pasting a single file,
 * so it is what the library shows by default. Passing a theme is what makes a
 * SET of videos agree, and it is deliberately an explicit act.
 */
const themeName = process.env.REMOTION_THEME;
const theme = themeName ? THEMES[themeName] : undefined;
if (themeName && !theme) {
  throw new Error(
    `REMOTION_THEME=${themeName} is not a theme. Try: ${Object.keys(THEMES).join(', ')}`,
  );
}

export const RemotionRoot: React.FC = () => {
  const categories = [...new Set(effects.map((e) => e.meta.category))].sort();

  return (
    <>
      {categories.map((category) => (
        <Folder name={folderName(category)} key={category}>
          {effects
            .filter((e) => e.meta.category === category)
            .map(({meta, Component, variantProps}) => (
              <Composition
                key={meta.id}
                id={meta.id}
                component={Component}
                durationInFrames={meta.durationInFrames}
                fps={meta.fps}
                width={meta.width}
                height={meta.height}
                // A variant is the same component with a different prop set.
                // Studio normally writes prop edits back into the literal it
                // finds here; it cannot do that through a variable, so an edit
                // to a variant is a scratch edit rather than a source change.
                // That is the right trade for eighty-three cards from one file —
                // the values live in the effect's own `meta.ts`, which IS source.
                defaultProps={
                  {...variantProps, ...(theme ? {theme} : {})} as Record<string, unknown> | undefined
                }
              />
            ))}
        </Folder>
      ))}
    </>
  );
};
