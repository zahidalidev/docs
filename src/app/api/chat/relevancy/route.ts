import { Langbase } from 'langbase';
import { NextRequest } from 'next/server';

// Create separate Langbase instances for each pipe with their specific API keys
const routerLangbase = new Langbase({
	apiKey: 'pipe_22xE7z31o3gmc6qReVXZ4DPedKQvPobh5u74ox7AeVA8u1DnyJqFUNvgdUppFn4FZfKwE7KhyqAUgBHf7nbfznjk'
});

const unrelatedQueriesLangbase = new Langbase({
	apiKey: 'pipe_5bFkUWJosZKmGvWbAkHUzWRQJ83jvGda3AYfyCsAE7Qf6AL2bDr1mYiU6MRt8jm4XJxnYS8Uh97jtgLLtTSscuWp'
});

const queryRewriteLangbase = new Langbase({
	apiKey: 'pipe_5XYj58sX3b4F1wqLb7VCH7qmk3h5vLVBZWHKesXTEtQpaBAfxpQBjJobZ98vLsY3BYk2UuFFDQdt4MonyazLGHto'
});

const docsLangbase = new Langbase({
	apiKey: 'pipe_DyGvtRozwYi1TTqJgxGZDiCrS4bfhsRQA2DDLasaYw7bKt8x6BJR324vwcgDmTk7uvGKXjYuBXhMpEgynd5Yq7Q'
});

export async function POST(req: NextRequest) {
	const options = await req.json();

	// Check if relevant
	let parsedResponse;
	let attempts = 0;
	const maxAttempts = 5;

	while (attempts < maxAttempts) {
		console.log('\n\n _checking_relevant');

		try {
			const router = await routerLangbase.pipe.run({
				...options,
				name: 'agent-router-related-to-sourcegraph',
				stream: false,
				variables: [{ name: 'userQuery', value: options.messages[0].content }],
			});

			// @ts-expect-error — TODO: Fix by reporting to Langbase
			parsedResponse = JSON.parse(router.completion);
			break;
		} catch (error) {
			attempts++;
			if (attempts === maxAttempts) {
				return new Response(JSON.stringify({ error: "Service not working at the moment. Please refresh and try again." }), {
					status: 500,
					headers: {
						'Content-Type': 'application/json'
					}
				});
			}
		}
	}

	console.log('\n\n relevant_reponse_', parsedResponse.relevant);

	// If not relevant, return a stream mimicking Langbase's structure
	if (!parsedResponse.relevant) {
		// Ask not relevant questions from agent ask-sourcegraph-docs-unrelated-queries
		const { stream, threadId } = await unrelatedQueriesLangbase.pipe.run({
			...options,
			name: 'ask-sourcegraph-docs-unrelated-queries'
		});

		return new Response(stream, {
			status: 200,
			headers: {
				'lb-thread-id': threadId ?? ''
			}
		});
	}

	// For relevant queries, first rewrite the query to make it more suitable for Sourcegraph
	let rewrittenQuery;
	attempts = 0;

	while (attempts < maxAttempts) {
		console.log('\n\n not_relevant_reponse_', parsedResponse.relevant);
		try {
			const rewriter = await queryRewriteLangbase.pipe.run({
				...options,
				name: 'query-rewrite',
				stream: false,
				variables: [
					{name: 'originalQuery', value: options.messages[0].content}
				]
			});

			// @ts-expect-error — Assuming the query-rewrite pipe returns a JSON with a rewrittenQuery field
			rewrittenQuery = JSON.parse(rewriter.completion).rewrittenQuery;
			break;
		} catch (error) {
			attempts++;
			if (attempts === maxAttempts) {
				// If query rewriting fails, proceed with the original query
				rewrittenQuery = options.messages[0].content;
			}
		}
	}

	console.log('\n\n _rewritten_query', rewrittenQuery);
	console.log('\n\n _original_query', options.messages[0].content);

	// Modify the user's message with the rewritten query
	const modifiedOptions = {
		...options,
		messages: [
			...options.messages.slice(0, -1), // Keep all but the last message
			{
				...options.messages[options.messages.length - 1],
				content: rewrittenQuery
			} // Replace the content of the last message
		]
	};

	console.log('\n\n __modified_Options', modifiedOptions);

	// Handle the relevant question with the (possibly) rewritten query
	const {stream, threadId} = await docsLangbase.pipe.run({
		...modifiedOptions,
		name: 'ask-sourcegraph-docs'
	});

	return new Response(stream, {
		status: 200,
		headers: {
			'lb-thread-id': threadId ?? ''
		}
	});
}


// Pretend answer is not relevant.
// const encoder = new TextEncoder();
// const stream = new ReadableStream({
//   start(controller) {
//     const chunk = {
//       id: `cmpl-${Math.random().toString(36).substr(2, 10)}`,
//       object: 'chat.completion.chunk' as const,
//       created: Math.floor(Date.now() / 1000),
//       model: 'gpt-3.5-turbo',
//       choices: [{
//         index: 0,
//         delta: { content: 'Please ask a relevant question to Sourcegraph.' },
//         logprobs: null,
//         finish_reason: 'stop'
//       }]
//     };
//     controller.enqueue(encoder.encode(JSON.stringify(chunk)));
//     controller.close();
//   }
// });

// return new Response(stream, {
//   status: 200,
//   headers: {
//     // Omit 'Content-Type' to allow stream processing
//   }
// });
