import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>

<GoogleOAuthProvider clientId="512153096284-7acg3p33vck4n7hhf9sohe7v4851hcc7.apps.googleusercontent.com">
      <App />
</GoogleOAuthProvider>
  </StrictMode>
)
