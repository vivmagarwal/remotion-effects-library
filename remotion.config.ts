import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Required for @remotion/effects (WebGL2) and <HtmlInCanvas> WebGL passes.
Config.setChromiumOpenGlRenderer('angle');
Config.setEntryPoint('./src/index.ts');
