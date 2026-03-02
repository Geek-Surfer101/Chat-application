import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import { ChatProvider } from "../context/ChatContext.jsx";
import { StrictMode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1e] to-[#2d2d35] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
            <p className="text-gray-400 mb-6 font-mono text-sm bg-black/30 p-3 rounded-lg">
                {error.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-3 justify-center">
                <button
                    onClick={resetErrorBoundary}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                    Try again
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                    Reload page
                </button>
            </div>
        </div>
    </div>
);

// Error handler for logging
const errorHandler = (error, info) => {
    console.error('Application Error:', error);
    console.error('Error Info:', info.componentStack);

    // You can send this to your error tracking service (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //     logErrorToService(error, info);
    // }
};

// Get the root element
const rootElement = document.getElementById('root');

// Ensure root element exists
if (!rootElement) {
    throw new Error('Failed to find the root element. Make sure there is a <div id="root"></div> in your HTML.');
}

// Create root
const root = createRoot(rootElement);

// Render application
root.render(
    <StrictMode>
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={errorHandler}
            onReset={() => {
                // Reset the state of your app here
                console.log('Error boundary reset');
            }}
        >
            <BrowserRouter
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                }}
            >
                <AuthProvider>
                    <ChatProvider>
                        <App />
                    </ChatProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </StrictMode>
);