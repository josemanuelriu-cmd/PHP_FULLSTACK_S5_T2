import { useState, useEffect, useRef } from 'react'

// Returns [msg, setMsg] where msg auto-clears after `delay` ms (default 5000)
export function useToast(delay = 5000) {
  const [msg, setMsgRaw] = useState({ text: '', isError: false })
  const timerRef = useRef(null)

  function setMsg(text, isError = false) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMsgRaw({ text, isError })
    if (text) {
      timerRef.current = setTimeout(() => setMsgRaw({ text: '', isError: false }), delay)
    }
  }

  // Clear timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return [msg, setMsg]
}
