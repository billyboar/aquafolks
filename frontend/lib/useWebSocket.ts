'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Message, WebSocketMessage, TypingIndicator, ReadReceipt } from './types'

interface UseWebSocketOptions {
  onMessage?: (message: Message) => void
  onTyping?: (typing: TypingIndicator) => void
  onReadReceipt?: (receipt: ReadReceipt) => void
  onError?: (error: string) => void
}

export function useWebSocket(token: string | null, options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  const connect = useCallback(() => {
    if (!token) return

    try {
      // WebSocket URL with token
      const wsUrl = `ws://localhost:3000/ws?token=${token}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const wsMessage: WebSocketMessage = JSON.parse(event.data)

          switch (wsMessage.type) {
            case 'message':
              const message = wsMessage.payload as Message
              setMessages(prev => [message, ...prev])
              options.onMessage?.(message)
              break

            case 'typing':
              const typing = wsMessage.payload as TypingIndicator
              options.onTyping?.(typing)
              break

            case 'read_receipt':
              const receipt = wsMessage.payload as ReadReceipt
              options.onReadReceipt?.(receipt)
              // Update message read status
              setMessages(prev => prev.map(m =>
                m.id === receipt.message_id ? { ...m, is_read: true } : m
              ))
              break

            case 'error':
              const error = wsMessage.payload?.error || 'Unknown error'
              console.error('WebSocket error:', error)
              options.onError?.(error)
              break
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        options.onError?.('WebSocket connection error')
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)

        // Attempt to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect... (attempt ${reconnectAttempts.current})`)
          connect()
        }, delay)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket:', error)
    }
  }, [token, options])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((receiverId: string, content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return
    }

    const message: WebSocketMessage = {
      type: 'message',
      payload: {
        receiver_id: receiverId,
        content
      }
    }

    wsRef.current.send(JSON.stringify(message))
  }, [])

  const sendTypingIndicator = useCallback((receiverId: string, isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    const message: WebSocketMessage = {
      type: 'typing',
      payload: {
        user_id: receiverId,
        is_typing: isTyping,
        timestamp: new Date().toISOString()
      }
    }

    wsRef.current.send(JSON.stringify(message))
  }, [])

  const sendReadReceipt = useCallback((messageId: string, userId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    const message: WebSocketMessage = {
      type: 'read_receipt',
      payload: {
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString()
      }
    }

    wsRef.current.send(JSON.stringify(message))
  }, [])

  useEffect(() => {
    if (token) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [token, connect, disconnect])

  return {
    isConnected,
    messages,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    connect,
    disconnect
  }
}
