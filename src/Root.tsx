import React from 'react';
import {Composition, Folder} from 'remotion';
import {effects} from './registry.generated';

/** Folder names may only contain letters, numbers and hyphens. */
const folderName = (category: string) =>
  category.replace(/[^A-Za-z0-9-]/g, '-');

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
                defaultProps={variantProps as Record<string, unknown> | undefined}
              />
            ))}
        </Folder>
      ))}
    </>
  );
};
