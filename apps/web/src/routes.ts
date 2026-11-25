import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	route('guide', 'routes/guide.tsx'),
	route('check', 'routes/check.tsx'),
	route('practice', 'routes/practice.tsx'),
	route('resources', 'routes/resources.tsx'),
	route('ai', 'routes/ai.tsx'),
	route('auth', 'routes/auth.tsx'),
	route('logout', 'routes/logout.tsx'),
	route('dashboard', 'routes/dashboard.tsx'),
	route('stories', 'routes/stories.tsx'),
	route('unsubscribe', 'routes/unsubscribe.tsx'),
	route('sitemap.xml', 'routes/sitemap.xml.ts'),
	route('robots.txt', 'routes/robots.txt.ts'),
	route('api/health', 'routes/api.health.ts'),
	route('api/practice', 'routes/api.practice.ts'),
	route('api/stories', 'routes/api.stories.ts'),
	route('api/unsubscribe', 'routes/api.unsubscribe.ts'),
	route('api/config', 'routes/api.config.ts'),
	route('api/*', 'routes/api.$.ts'),
] satisfies RouteConfig;
