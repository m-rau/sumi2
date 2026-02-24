import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { LcarsButton, LcarsPanel } from '@/components/lcars'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
          <LcarsPanel corner="all" header="System Error" headerColor="salmon" className="max-w-lg">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-lcars-salmon mx-auto" />
              <h2 className="text-xl font-bold text-lcars-orange">
                An unexpected error occurred
              </h2>
              <p className="text-text-muted">
                {this.state.error?.message || 'Something went wrong'}
              </p>
              <LcarsButton onClick={this.handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Application
              </LcarsButton>
            </div>
          </LcarsPanel>
        </div>
      )
    }

    return this.props.children
  }
}
