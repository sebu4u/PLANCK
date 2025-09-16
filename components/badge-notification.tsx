"use client"

import React, { useState, useEffect } from 'react'
import { X, Trophy, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BadgeNotificationProps {
  badge: {
    id: string
    name: string
    description: string
    icon: string
    color: string
  }
  onClose: () => void
}

export function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in when component mounts
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    // Wait for animation to complete before calling onClose
    setTimeout(onClose, 300)
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isVisible 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
    }`}>
      <Card className="w-80 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-2xl backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Badge Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                {badge.icon}
              </div>
            </div>
            
            {/* Badge Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h3 className="font-bold text-gray-900 text-sm">Badge nou câștigat!</h3>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-semibold text-gray-800 text-base">{badge.name}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{badge.description}</p>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 w-8 h-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-2 left-2 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </CardContent>
      </Card>
    </div>
  )
}
