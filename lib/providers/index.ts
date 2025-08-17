import OpenAI from "@/components/icons/openai"

export type Provider = {
  id: string
  name: string
  available: boolean
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export const PROVIDERS: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    icon: OpenAI,
  },
] as Provider[]
