/// <reference types="vite/client" />

// CSS module declarations
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// Allow importing CSS files
declare module '*.css'
