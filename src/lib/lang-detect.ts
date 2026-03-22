// Simple language detection based on common words
const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'est', 'en', 'avec', 'pour', 'dans', 'sur', 'au', 'aux', 'qui', 'que', 'par', 'je', 'vous', 'nous', 'mon', 'ma', 'mes']
const englishWords = ['the', 'and', 'for', 'with', 'this', 'that', 'have', 'from', 'they', 'will', 'your', 'are', 'was', 'been', 'our', 'has', 'had']

export function detectLang(text: string): 'en' | 'fr' | 'unknown' {
  const words = text.toLowerCase().split(/\s+/)
  const sample = words.slice(0, 200)

  let frScore = 0
  let enScore = 0

  for (const word of sample) {
    if (frenchWords.includes(word)) frScore++
    if (englishWords.includes(word)) enScore++
  }

  if (frScore > enScore && frScore > 3) return 'fr'
  if (enScore > frScore && enScore > 3) return 'en'
  return 'unknown'
}
