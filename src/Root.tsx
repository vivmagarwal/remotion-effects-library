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
            .map(({meta, Component}) => (
              <Composition
                key={meta.id}
                id={meta.id}
                component={Component}
                durationInFrames={meta.durationInFrames}
                fps={meta.fps}
                width={meta.width}
                height={meta.height}
              />
            ))}
        </Folder>
      ))}
    </>
  );
};
