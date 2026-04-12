import React from 'react'

const Footer = () => {
  return (
    
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
              H
            </div>
            <p>© {new Date().getFullYear()} Hemo. Your sickle cell companion.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#impact" className="hover:text-foreground transition-colors">
              Impact
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Stories
            </a>
            <a href="#waitlist" className="hover:text-foreground transition-colors">
              Waitlist
            </a>
          </div>
        </div>
      </footer>
  )
}

export default Footer