import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'sankey-flow', name: 'Sankey Flow', category: 'charts',
  tagline: 'Value moving left to right, splitting and recombining.',
  description:
    'Every band thickness is proportional to what it carries — that is the whole chart, and d3-sankey computes all of it. The thing to know first is that sankey() mutates what you give it: it stamps index, sourceLinks, targetLinks, value, depth, height, layer and x0/y0/x1/y1 onto your nodes and replaces each link source and target id with a reference to the node object. Re-running it is not destructive (computeNodeLinks guards on the type), but it leaves your props circularly referential, so JSON.stringify throws and the Studio props panel breaks; links[i].source also silently changes type from string to object. Hence: run it once in a useMemo, on clones. Two further details do the visual work. Links are coloured with a per-link gradient from source to target rather than by source alone, because a node feeding several terminals otherwise paints that whole side of the chart one flat colour. And the reveal wipes along the direction of flow with the leading edge starting off the plot — driving it from p * plotW instead puts the edge at 0 when p is 0, which is already inside the first column window, so column one appears before the wipe has begun.',
  tags: ['chart', 'd3', 'svg', 'gradient'],
  concepts: ['d3-sankey', 'deterministic layout', 'layered gradients'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', 'd3-sankey', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 72, posterFrame: 150,
  ground: 'both', audience: ['data'], driveMode: 'pure',
};
