import { createRoot } from 'react-dom/client'
import { Suspense } from 'react'
import ModelPreview from './ModelPreview.jsx'

createRoot(document.getElementById('root')).render(
  <Suspense fallback={<div style={{color:'#00f0ff',fontFamily:'monospace',padding:40}}>Loading models...</div>}>
    <ModelPreview />
  </Suspense>
)
