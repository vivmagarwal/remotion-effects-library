/**
 * The shape every `scripts/check-*.mjs` shares: collect problems, print each one
 * with a file and a line, exit non-zero if there are any.
 *
 * A gate that prints and exits 0 is not a gate — `check-dead-frames.mjs` did
 * exactly that and the README called it a rejection.
 */
import {relative} from 'node:path';
import {ROOT} from './fs.mjs';

export const rel = (p) => (p.startsWith('/') ? relative(ROOT, p) : p);

/** 1-based line number of `needle`'s first occurrence in `source`, or 0. */
export const lineOfMatch = (source, needle) => {
  const at = typeof needle === 'string' ? source.indexOf(needle) : source.search(needle);
  return at === -1 ? 0 : source.slice(0, at).split('\n').length;
};

export const gate = (name) => {
  const problems = [];
  const notes = [];
  return {
    /** @param where `path`, or `path:line` */
    fail(where, message, detail) {
      problems.push({where, message, detail});
    },
    note(message) {
      notes.push(message);
    },
    get failed() {
      return problems.length;
    },
    done(okMessage, cap = 40) {
      for (const n of notes) console.log(`  note  ${n}`);
      for (const p of problems.slice(0, cap)) {
        console.log(`  FAIL  ${p.where}`);
        console.log(`          ${p.message}`);
        if (p.detail) for (const d of [].concat(p.detail)) console.log(`          ${d}`);
      }
      if (problems.length > cap) console.log(`  … and ${problems.length - cap} more`);
      console.log(problems.length ? `\n${name}: ${problems.length} problem(s).` : `\n${name}: ${okMessage}`);
      process.exit(problems.length ? 1 : 0);
    },
  };
};
