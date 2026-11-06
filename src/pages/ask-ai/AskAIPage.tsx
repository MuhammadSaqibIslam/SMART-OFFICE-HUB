import { useEffect, useState, useRef, useCallback } from 'react'
import { PanelLeft, Sparkles } from 'lucide-react'
import { ChatSidebar } from './components/ChatSidebar'
import { ChatMessage, ThinkingIndicator } from './components/ChatMessage'
import { ChatInput } from './components/ChatInput'
import { WelcomeScreen } from './components/WelcomeScreen'
import {
  getConversations,
  createConversation,
  deleteConversation,
  deleteConversations,
  updateConversationTitle,
  getMessages,
  addMessage,
  askQuestion,
} from '@/services/askAI'
import type { AIConversation, AIMessage } from '@/types/database'
import { getErrorMessage } from '@/lib/errors'

export function AskAIPage() {
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await getConversations())
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])
  useEffect(() => { scrollToBottom() }, [messages])

  const loadMessages = async (convId: string) => {
    try { setMessages(await getMessages(convId)) } catch { setMessages([]) }
  }

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    setError(null)
    loadMessages(id)
  }

  const handleNewChat = () => {
    setActiveId(null)
    setMessages([])
    setError(null)
  }

  const handleSend = async (question: string) => {
    setError(null)
    setSending(true)
    try {
      let convId = activeId
      if (!convId) {
        const title = question.length > 50 ? question.slice(0, 47) + '...' : question
        const conv = await createConversation(title)
        convId = conv.id
        setActiveId(convId)
        await loadConversations()
      }
      const userMsg = await addMessage(convId, 'user', question)
      setMessages((prev) => [...prev, userMsg])
      const answer = await askQuestion(convId, question)
      const aiMsg = await addMessage(convId, 'assistant', answer)
      setMessages((prev) => [...prev, aiMsg])
      await loadConversations()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to get response. Please try again.'))
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteConversation(id)
    if (activeId === id) { setActiveId(null); setMessages([]) }
    await loadConversations()
  }

  const handleBulkDelete = async (ids: string[]) => {
    await deleteConversations(ids)
    if (activeId && ids.includes(activeId)) { setActiveId(null); setMessages([]) }
    await loadConversations()
  }

  const handleRename = async (id: string, title: string) => {
    await updateConversationTitle(id, title)
    await loadConversations()
  }

  const activeTitle = activeId ? conversations.find((c) => c.id === activeId)?.title : null

  return (
    <div className="flex h-[calc(100vh-3.5rem-3.5rem)] sm:h-[calc(100vh-4rem-3.5rem)] md:h-[calc(100vh-4rem-4rem)] lg:h-[calc(100vh-4.25rem-4rem)] xl:h-[calc(100vh-4.25rem)] -mx-3 -mt-3 -mb-20 sm:-mx-5 sm:-mt-5 lg:-mx-6 lg:-mt-6 xl:-mb-6 rounded-none overflow-hidden bg-background">
      {/* Chat History Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onRename={handleRename}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0 bg-surface">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b border-border-default px-4 py-3 bg-surface">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors md:hidden"
          >
            <PanelLeft className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-sm font-semibold text-text-primary truncate">
              {activeTitle || 'New Conversation'}
            </h2>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {!activeId && messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={handleSend} />
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {sending && <ThinkingIndicator />}
              {error && (
                <div className="px-4 sm:px-6 py-3">
                  <div className="mx-auto max-w-3xl rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} sending={sending} />
      </div>
    </div>
  )
}
