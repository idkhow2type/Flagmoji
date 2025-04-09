/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		let flagCode = url.pathname.slice(1);

		const codeMaps = {
			ac: 'sh',
			cp: 'fr',
			dg: 'io',
			ta: 'sh',
			ea: 'es',
			gbeng: 'gb-eng',
			gbsct: 'gb-sct',
			gbwls: 'gb-wls',
		};
		
		flagCode = codeMaps[flagCode as keyof typeof codeMaps] || flagCode;

		const srcMaps = {
			ic: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Flag_of_the_Canary_Islands_%28simple%29.svg',
			sy: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Flag_of_Syria_%282025-%29.svg',
			trans: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Transgender_Pride_flag.svg',
		};

		return Response.redirect(srcMaps[flagCode as keyof typeof srcMaps] || `https://flagcdn.com/${flagCode}.svg`, 302);
	},
} satisfies ExportedHandler<Env>;
