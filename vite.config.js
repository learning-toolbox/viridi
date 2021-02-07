import { viridiPlugin } from './viridi-plugin/node';

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [viridiPlugin()],
};
