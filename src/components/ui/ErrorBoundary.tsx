import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-danger/10 border border-danger/40 rounded-card p-6 space-y-3">
          <div className="text-danger font-bold text-sm">Erro no componente</div>
          <pre className="text-[11px] text-danger/80 whitespace-pre-wrap overflow-auto">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
