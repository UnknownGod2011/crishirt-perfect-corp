type ToolInput = Record<string, unknown>;
type ExecutionOptions = { signal?: AbortSignal };
type WebMCPToolLike = {
  execute?: (input: ToolInput, options?: ExecutionOptions) => Promise<unknown> | unknown;
  [key: string]: unknown;
};
type RegisterOptions = { signal?: AbortSignal };
type ModelContextLike = {
  registerTool: (tool: WebMCPToolLike, options?: RegisterOptions) => Promise<void>;
};

const INSTALL_MARKER = Symbol.for('crishirt.webmcp.execute-compat');

export function installWebMCPExecuteCompatibility() {
  const modelContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
  if (!modelContext?.registerTool) return;

  const taggedContext = modelContext as ModelContextLike & { [INSTALL_MARKER]?: boolean };
  if (taggedContext[INSTALL_MARKER]) return;

  const nativeRegisterTool = modelContext.registerTool.bind(modelContext);
  const fallbackController = new AbortController();

  try {
    modelContext.registerTool = (tool, registrationOptions) => {
      if (typeof tool?.execute !== 'function') return nativeRegisterTool(tool, registrationOptions);
      const execute = tool.execute;
      return nativeRegisterTool({
        ...tool,
        execute: (input: ToolInput, executionOptions?: ExecutionOptions) => execute(input, {
          signal: executionOptions?.signal ?? registrationOptions?.signal ?? fallbackController.signal,
        }),
      }, registrationOptions);
    };
    taggedContext[INSTALL_MARKER] = true;
  } catch (error) {
    console.warn('[WebMCP] Could not install execute compatibility adapter.', error);
  }
}
