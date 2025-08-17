// Usage checks removed

type CreateChatInput = {
  userId: string
  title?: string
  model: string
  projectId?: string
}

export async function createChatInDb({
  userId,
  title,
  model,
  projectId,
}: CreateChatInput) {
  // no-op usage check

  const insertData: {
    user_id: string
    title: string
    model: string
    project_id?: string
  } = {
    user_id: userId,
    title: title || "New Chat",
    model,
  }

  if (projectId) {
    insertData.project_id = projectId
  }

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    title: insertData.title,
    model,
    project_id: insertData.project_id || null,
    public: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
