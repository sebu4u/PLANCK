import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function LoadingProblemDetail() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16">
        {/* Hero Section Skeleton */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto">
            {/* Navigation breadcrumb and sidebar toggle */}
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              {/* Main content area */}
              <div className="lg:col-span-2">
                {/* Problem icon and badges */}
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-7 w-24" />
                  </div>
                </div>
                
                {/* Title */}
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-12 w-4/5 mb-4" />
                
                {/* Description */}
                <div className="space-y-2 mb-6">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="border-purple-200 sticky top-24">
                  <CardHeader>
                    <CardTitle>
                      <Skeleton className="h-6 w-40" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-18" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Content Skeleton */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <Card className="border-purple-200 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-48" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-inner">
                {/* Problem statement */}
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
                
                {/* Problem image placeholder */}
                <div className="mt-6 flex justify-center">
                  <Skeleton className="w-full max-w-2xl h-96 rounded-lg" />
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Skeleton className="h-14 w-64" />
                <Skeleton className="h-14 w-56" />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      
      {/* Footer skeleton */}
      <div className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-18" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-28" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-22" />
                <Skeleton className="h-4 w-26" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-22" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
