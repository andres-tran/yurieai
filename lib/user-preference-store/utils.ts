export type UserPreferences = {
  layout: "fullscreen"
  showToolInvocations: boolean
  showConversationPreviews: boolean
  hiddenModels: string[]
}

export const defaultPreferences: UserPreferences = {
  layout: "fullscreen",
  showToolInvocations: true,
  showConversationPreviews: true,
  hiddenModels: [],
}

type ApiPreferences = {
  layout?: string
  show_tool_invocations?: boolean
  show_conversation_previews?: boolean
  hidden_models?: string[]
}

// Helper functions to convert between API format (snake_case) and frontend format (camelCase)
export function convertFromApiFormat(apiData: ApiPreferences): UserPreferences {
  return {
    layout: "fullscreen",
    showToolInvocations: apiData.show_tool_invocations ?? true,
    showConversationPreviews: apiData.show_conversation_previews ?? true,
    hiddenModels: apiData.hidden_models || [],
  }
}

export function convertToApiFormat(preferences: Partial<UserPreferences>) {
  const apiData: ApiPreferences = {}
  if (preferences.layout !== undefined) apiData.layout = "fullscreen"
  if (preferences.showToolInvocations !== undefined)
    apiData.show_tool_invocations = preferences.showToolInvocations
  if (preferences.showConversationPreviews !== undefined)
    apiData.show_conversation_previews = preferences.showConversationPreviews
  if (preferences.hiddenModels !== undefined)
    apiData.hidden_models = preferences.hiddenModels
  return apiData
}
