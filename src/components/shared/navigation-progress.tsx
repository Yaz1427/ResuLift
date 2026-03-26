'use client'

import { AppProgressBar } from 'next-nprogress-bar'

export function NavigationProgress() {
  return (
    <AppProgressBar
      height="2px"
      color="#7C3AED"
      options={{ showSpinner: false }}
      shallowRouting
    />
  )
}
