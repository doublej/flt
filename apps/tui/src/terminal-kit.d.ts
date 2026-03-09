declare module 'terminal-kit' {
  interface Terminal {
    (...args: unknown[]): Terminal
    width: number
    height: number

    // Screen
    fullscreen(on: boolean): Terminal
    clear(): Terminal
    eraseLine(): Terminal
    eraseDisplay(): Terminal

    // Cursor
    moveTo(x: number, y: number, ...args: unknown[]): Terminal
    hideCursor(hide?: boolean): Terminal

    // Input
    grabInput(options: boolean | { mouse?: string | boolean }): Terminal

    // Style reset
    styleReset(): Terminal
    noFormat: Terminal

    // Process
    processExit(code?: number): void

    // Foreground colors (chainable + callable)
    green: Terminal
    brightGreen: Terminal
    yellow: Terminal
    brightYellow: Terminal
    red: Terminal
    black: Terminal
    white: Terminal
    cyan: Terminal
    brightCyan: Terminal

    // Background colors
    bgBlack: Terminal
    bgGreen: Terminal
    bgBrightGreen: Terminal

    // Attributes
    dim: Terminal
    bold: Terminal
    inverse: Terminal

    // Events
    on(event: string, handler: (...args: unknown[]) => void): Terminal
  }

  export const terminal: Terminal
}
