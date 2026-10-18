import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: 'src',
	// Keep the client and server builds beside one another. `react-router-serve`
	// resolves the client asset directory relative to the server build; placing
	// the build outside this app made `/assets/*.css` resolve to a non-existent
	// nested `dist` path in production.
	buildDirectory: 'build',
	ssr: true,
} satisfies Config;
