"use client"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { isFeatureEnabled } from "@/lib/feature-flags"
import { toast } from "sonner"

export function FeedbackPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isFeatureEnabled("FeedbackCTA")) return

    // Check if user has already submitted feedback (permanent)
    const hasSubmittedFeedback = localStorage.getItem("has-submitted-feedback")
    if (hasSubmittedFeedback) return

    // Check if user has already seen or dismissed the popup in this session
    const hasSeenPopup = sessionStorage.getItem("has-seen-feedback-popup")
    
    if (hasSeenPopup) return

    const timer = setTimeout(() => {
      setIsOpen(true)
      sessionStorage.setItem("has-seen-feedback-popup", "true")
    }, 60000) // 1 minute (Restoring to 1 min)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      // Persist that the user has submitted feedback so we never ask again
      localStorage.setItem("has-submitted-feedback", "true")

      toast.success("Thank you for your feedback!")
      setFeedback("")
      setIsOpen(false)
    } catch (error) {
      console.error("Feedback submission error:", error)
      toast.error("Failed to send feedback. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSocialLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Error signing in with Google", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none gap-0">
        <div className="flex flex-col sm:flex-row min-h-[500px]">
          {/* Left Side: Call to Action */}
          <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center bg-background">
            <div className="space-y-6 max-w-sm mx-auto sm:mx-0">
              <div className="space-y-2">
                <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Help me build the future of Decidere
                </DialogTitle>
                <p className="text-muted-foreground text-sm sm:text-base">
                  I am building this for you. Your feedback helps me prioritize what to build next.
                </p>
              </div>

              <div className="space-y-4">
                {isFeatureEnabled("GoogleAuth") && (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        variant="outline" 
                        type="button"
                        className="w-full gap-2 h-11"
                        onClick={handleSocialLogin}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>
                        Continue with Google
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or share anonymous feedback
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <form onSubmit={handleSubmitFeedback} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="feedback" className="sr-only">Feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="What would make this tool 10x better for you?"
                      className="resize-none min-h-[80px]"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!feedback.trim() || isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Feedback"}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Side: Portrait */}
          <div className="flex-1 relative hidden sm:block bg-muted">
            <Image
              src="/founder.jpeg"
              alt="Pascal - Founder of Decidere"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
              <p className="font-medium text-lg">Pascal</p>
              <p className="text-white/80 text-sm">Founder of Decidere</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
