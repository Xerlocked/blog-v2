export default {
	async fetch(request, env, _ctx) {
		const url = new URL(request.url);
		const currentPath = decodeURIComponent(url.pathname);

		// 1. 리다이렉트 맵
		const redirectMap = {
			"/posts/write/siuengine/":
				"/2025/08/25/%ED%81%AC%EB%9E%98%ED%94%84%ED%86%A4-%EC%9E%90%EC%B2%B4-%EC%97%94%EC%A7%84-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/",
		};

		// 2. 리다이렉트 처리
		if (redirectMap[currentPath]) {
			const newUrl = new URL(redirectMap[currentPath], url.origin);
			return Response.redirect(newUrl, 301);
		}

		return env.ASSETS.fetch(request);
	},
};
