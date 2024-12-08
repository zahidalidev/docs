import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import rehypeParse from 'rehype-parse';
import Markdown from 'react-markdown'
import { unified } from 'unified';

import {OAISchema, Operation, SchemaProperty} from './types';
import { CodeSelect, SelectOption } from './Select';
import {ApiSpec, newApiSpec} from './ApiSpec';
import openapi from './openapi.Sourcegraph.Latest.json';
import shadesOfPurple from './../../../src/styles/shades-of-purple.json'

const prettyCodeOptions = {
  keepBackground: true,
  theme: shadesOfPurple
};

let spec: ApiSpec | undefined;

function loadSpec() {
	if (!spec) spec = newApiSpec(openapi);
	return spec;
}

export function ApiOperation(props: {operation: string}) {
	const operation = loadSpec().findOperation(props.operation);

	if (!operation)
		return <div>Operation {props.operation} not found</div>;

	return (
		<div>
			<p>{operation.description}</p>
			{example(operation)}
			{request(operation)}
			{response(operation)}
		</div>
	);
}

function request(operation: Operation) {
	if (
		!operation.schema.requestBody &&
		operation.schema.parameters.length === 0
	) {
		return null;
	}
	return (
		<div>
			<h3>Request: application/json</h3>
			{operation.schema.requestBody &&
				schema(operation.schema.requestBody)}
			{operation.schema.requestBody && (
				<pre>
					Request body:{' '}
					{JSON.stringify(operation.schema.requestBody, null, 2)}
				</pre>
			)}
			{operation.schema.parameters && (
				<pre>
					Parameters:{' '}
					{JSON.stringify(operation.schema.parameters, null, 2)}
				</pre>
			)}
		</div>
	);
}

function response(operation: Operation) {
	if (!operation.schema.response) {
		return null;
	}
	return (
		<div>
			<h3>Response: application/json</h3>
			{schema(operation.schema.response)}
		</div>
	);
}

async function Code(props: {lang: string; children: React.ReactNode}) {
  const processor = unified()
    .use(rehypeParse as any, { fragment: true })
    .use(rehypePrettyCode as any, prettyCodeOptions as any)
    .use(rehypeStringify as any)

  const html = await processor.process(`<pre><code class="language-${props.lang}">${props.children}</code></pre>`);

  return (
    <div className="relative">
      <div dangerouslySetInnerHTML={{ __html: html.toString() }} />
    </div>
  );
}

// Replace the existing Tabs usage with:
function example(operation: Operation) {
  if (!operation.example)
    return null;

  return (
    <div>
      <h3>Example</h3>
      <CodeSelect>
        <SelectOption title="Curl">
          <Code lang="bash">{curlCommand(operation)}</Code>
        </SelectOption>
        <SelectOption title="TypeScript">
          <Code lang="typescript">
            {typescriptExample(operation)}
          </Code>
        </SelectOption>
        <SelectOption title="Python">
          <Code lang="python">{pythonExample(operation)}</Code>
        </SelectOption>
      </CodeSelect>
      <p>
        <b>Example response:</b>
      </p>
      <Code lang="json">
        {JSON.stringify(operation.example.response, null, 2)}
      </Code>
    </div>
  );
}

function formatJson(json: any, indent: string) {
	return JSON.stringify(json, null, 2).replaceAll('\n', '\n' + indent);
}

function typescriptExample(operation: Operation): string {
	const out: string[] = []
	out.push(`import fetch from 'node-fetch'`)
	out.push(`const endpoint = process.env.SRC_ENDPOINT`)
	out.push(`const accessToken = process.env.SRC_ACCESS_TOKEN`)
	out.push(`fetch(\`\${endpoint}${operation.path}\`, {`)
	if (operation.method !== 'get') {
			out.push(`    method: '${operation.method}',`)
	}
	out.push(`    headers: {`)
	out.push(`        'Authorization': \`token \${accessToken}\`,`)
	out.push(`    },`)
	if (operation.example?.request) {
			out.push(`    body: JSON.stringify(${formatJson(operation.example.request, '    ')})`)
	}
	out.push(`})`)
	out.push(`.then(response => response.json())`)
	out.push(`.then(data => console.log(data))`)
	return out.join('\n')
}

function pythonExample(operation: Operation): string {
	const out: string[] = [];
	out.push(`import os`);
	out.push(`import requests`);
	out.push(`endpoint = os.getenv('SRC_ENDPOINT')`);
	out.push(`access_token = os.getenv('SRC_ACCESS_TOKEN')`);
	out.push(`response = requests.${operation.method.toLowerCase()}(`);
	out.push(`    url=f'{endpoint}${operation.path}',`);
	out.push(`    headers={"Authorization": f'token {access_token}'},`);
	if (operation.example?.request) {
		out.push(`    json=${formatJson(operation.example.request, '    ')}`);
	}
	out.push(`)`);
	out.push(`print(response.json())`);
	return out.join('\n');
}

function curlCommand(operation: Operation): string {
	const out: string[] = [];
	out.push(`curl "$SRC_ENDPOINT${operation.path}"`);
	out.push('--header "Authorization: token $SRC_ACCESS_TOKEN"');
	if (operation.method !== 'get') {
		out.push(`--request ${operation.method.toUpperCase()}`);
	}
	if (operation.example?.request) {
		out.push(`--data '${formatJson(operation.example.request, '  ')}'`);
	}

	return out.join(' \\\n  ');
}

function schema(schema: OAISchema): React.ReactNode {
	const spec = loadSpec();
	schema = spec.canonical(schema);
	const rows: React.ReactNode[] = [];
	const refs = new Set<string>();
	const isRendered = new Set<string>();
	schemaProperties(spec, '', schema, rows, refs);
	while (refs.size > 0) {
		const ref = refs.values().next().value;
		refs.delete(ref);
		if (isRendered.has(ref)) {
			// Important: avoid infinite loop
			continue;
		}
		isRendered.add(ref);
		schemaProperties(spec, componentName(ref), spec.ref(ref), rows, refs);
	}

	return (
		<table>
			<thead>
				<tr>
					<th>Field</th>
					<th>Type</th>
					<th>Required</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>{rows}</tbody>
		</table>
	);
}

function schemaProperties(
	spec: ApiSpec,
	prefix: string,
	schema: OAISchema,
	rows: React.ReactNode[],
	refs: Set<string>
): void {
	const properties = spec.properties(schema);
	for (const property of properties) {
		rows.push(
			<tr>
				<td>
					{prefix ? `${prefix}.${property.name}` : property.name}
				</td>
				<td>{schemaType(property.schema, refs)}</td>
				<td>{schemaRequired(schema, property)}</td>
				<td>{schemaDescription(property.schema)}</td>
			</tr>
		);
	}
}

function componentName(component: string): string {
	return component.split('/').pop() ?? component;
}

function refType(ref: string, refs: Set<string>): string {
	refs.add(ref);
	return componentName(ref);
}

function schemaType(schema: OAISchema, refs: Set<string>): React.ReactNode {
	if (schema.$ref) {
		return <span>{refType(schema.$ref, refs)}</span>;
	}
	if (schema.type === 'array') {
		const name = schema.items?.$ref
			? refType(schema.items.$ref, refs)
			: schema.items?.type ?? '';
		return <span>{name}[]</span>;
	}
    if (schema.anyOf && schema.anyOf.length > 0) {
		const parts = schema.anyOf.map((tpe, index) => (
			<span key={index} >{schemaType(tpe, refs)}</span>
		));
		return joinReactNodes(parts, ' | ');
	}
	return schema.type;
}

function schemaRequired(
	schema: OAISchema,
	property: SchemaProperty
): React.ReactNode {
	console.log({schema: schema, property: property.name});
	if (schema.required?.includes(property.name)) {
		return <span>Yes</span>;
	}
	return <span>No</span>;
}

function schemaDescription(schema: OAISchema): React.ReactNode {
	const parts: React.ReactNode[] = [];
	if (schema.description) {
		parts.push(<Markdown>{schema.description}</Markdown>);
	}
	if (schema.enum && schema.type === 'string') {
		const values = schema.enum.map((value, index) => <code key={index}>"{value}"</code>);
		if (values.length === 1) {
			parts.push(<span>Value: {values[0]}</span>);
		} else {
			parts.push(<span>One of: {joinReactNodes(values, ",")}</span>);
		}
	}

	if (
		typeof schema.minimum === 'number' &&
		typeof schema.maximum === 'number'
	) {
		parts.push(
			<span>
				Range:{' '}
				<code>
					{schema.minimum} &lt;= x &lt;= {schema.maximum}
				</code>
			</span>
		);
	} else if (typeof schema.minimum === 'number') {
		parts.push(
			<span>
				Minimum: <code>{schema.minimum}</code>
			</span>
		);
	} else if (typeof schema.maximum === 'number') {
		parts.push(
			<span>
				Maximum: <code>{schema.maximum}</code>
			</span>
		);
	}

	return joinReactNodes(parts, <></>);
}

function joinReactNodes(values: React.ReactNode[], separator: React.ReactNode) {
	if (values.length === 0) return null;

	return values.reduce((prev, curr, i) =>
		i === 0 ? (
			curr
		) : (
			<>
				{prev}
				{separator}
				{curr}
			</>
		)
	);
}
