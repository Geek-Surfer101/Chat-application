import React, { useContext, useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { Menu, MessageCircle, Wifi, WifiOff } from 'lucide-react'

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext)
  const { authUser, onlineUser, isLoading } = useContext(AuthContext)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showWelcome, setShowWelcome] = useState(true)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Hide welcome message after 3 seconds
  useEffect(() => {
    if (authUser) {
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [authUser])

  // Get online friends count
  const onlineFriendsCount = onlineUser?.filter(id => id !== authUser?._id).length || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a1a1e] to-[#2d2d35]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
            <MessageCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-violet-400" size={24} />
          </div>
          <p className="mt-4 text-gray-400 animate-pulse">Loading your chats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1e] to-[#2d2d35] relative">
      {/* Network Status Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500/90 text-white text-center py-2 z-50 animate-slideDown">
          <div className="flex items-center justify-center gap-2">
            <WifiOff size={16} />
            <span className="text-sm font-medium">You are offline. Some features may be unavailable.</span>
          </div>
        </div>
      )}

      {/* Welcome Toast */}
      {showWelcome && authUser && (
        <div className="fixed top-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slideInRight">
          <div className="flex items-center gap-2">
            <Wifi size={16} />
            <span className="text-sm">Welcome back, {authUser.fullName}!</span>
          </div>
        </div>
      )}

      {/* Online Friends Count (Mobile) */}
      {onlineFriendsCount > 0 && (
        <div className="md:hidden fixed top-4 right-4 bg-violet-600 text-white px-3 py-1 rounded-full text-xs z-40 shadow-lg">
          {onlineFriendsCount} online
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileSidebar(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-[#282142] rounded-lg text-white shadow-lg hover:bg-[#322855] transition-colors"
        aria-label="Open sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Main Container */}
      <div className="container mx-auto h-screen px-4 py-4 md:px-8 md:py-6">
        <div className={`
                    backdrop-blur-xl bg-white/5 border border-gray-700/50 rounded-2xl overflow-hidden
                    h-full grid transition-all duration-300
                    ${selectedUser
            ? 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]'
            : 'grid-cols-1 md:grid-cols-[1fr_2fr]'
          }
                `}>
          {/* Sidebar - Desktop always visible, Mobile conditionally */}
          <div className={`
                        ${showMobileSidebar ? 'block' : 'hidden'}
                        md:block h-full
                    `}>
            <Sidebar />
          </div>

          {/* Chat Container - Always visible */}
          <div className="h-full relative">
            <ChatContainer />
          </div>

          {/* Right Sidebar - Only visible when user selected */}
          {selectedUser && (
            <div className="hidden md:block h-full">
              <RightSidebar />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-4/5 max-w-xs bg-[#1a1a1e] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* Empty State for Mobile when no user selected */}
      {!selectedUser && (
        <div className="md:hidden fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-700/50 mx-4">
            <MessageCircle size={48} className="mx-auto text-violet-400 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to QuickChat!</h3>
            <p className="text-gray-400">Select a friend from the sidebar to start chatting</p>
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="mt-4 pointer-events-auto bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Open Sidebar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage