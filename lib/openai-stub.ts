export default class OpenAI {
  constructor(config: { apiKey: string }) {
    void config
  }
  responses = {
    stream: (args: unknown) => {
      void args
      async function* gen(): AsyncGenerator<never, void, unknown> {}
      const iterator = gen() as AsyncGenerator<never, void, unknown> & {
        final: () => Promise<{ output: unknown[] }>
      }
      iterator.final = async () => ({ output: [] })
      return iterator
    },
  }
  images = {
    generate: async (args: unknown): Promise<{ data: Array<{ b64_json: string }> }> => {
      void args
      return { data: [{ b64_json: "" }] }
    },
  }
  chat = {
    completions: {
      create: async (_args: unknown): Promise<{ choices: Array<{ message: { content: string } }> }> => {
        void _args
        return { choices: [{ message: { content: "" } }] }
      },
    },
  }
}
