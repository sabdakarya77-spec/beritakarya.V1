/**
 * Stub file - akan diimplementasi nanti
 */
import type { Block } from '@beritakarya/types'
import { v4 as uuidv4 } from 'uuid'

export function createDefaultBlock(type: Block['type'], existingId?: string): Block {
  const id = existingId || uuidv4()
  switch (type) {
    case 'paragraph':
      return { id, type: 'paragraph', content: '' }
    case 'heading':
      return { id, type: 'heading', level: 2, content: '' }
    case 'quote':
      return { id, type: 'quote', content: '', attribution: '' }
    case 'image':
      return { id, type: 'image', url: '', alt: '' }
    case 'list':
      return { id, type: 'list', items: [''], ordered: false }
    case 'callout':
      return { id, type: 'callout', content: '', variant: 'editorial' }
    case 'embed':
      return { id, type: 'embed', url: '', embedType: 'youtube' }
    default:
      return { id, type: 'paragraph', content: '' }
  }
}
