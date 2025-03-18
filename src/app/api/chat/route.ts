import { Langbase } from 'langbase';
import { NextRequest } from 'next/server';

// const apiKey = process.env.LANGBASE_API_KEY!;
const apiKey = 'pipe_DyGvtRozwYi1TTqJgxGZDiCrS4bfhsRQA2DDLasaYw7bKt8x6BJR324vwcgDmTk7uvGKXjYuBXhMpEgynd5Yq7Q';

const langbase = new Langbase({
	apiKey
});

export async function POST(req: NextRequest) {
	const options = await req.json();

	const { stream, threadId } = await langbase.pipe.run({
		...options,
		name: 'ask-sourcegraph-docs'
	});

	return new Response(stream, {
		status: 200,
		headers: {
			'lb-thread-id': threadId ?? ''
		}
	});
}
