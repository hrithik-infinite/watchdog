import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import logger from '@/shared/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    // A React error boundary only catches errors thrown during render/commit of
    // its descendants. Failures in async code (rejected promises, setTimeout
    // callbacks, event handlers) escape that path and were previously swallowed
    // with no trace. Capture them at the window level so they are at least
    // surfaced through the shared logger for diagnosis. We deliberately log
    // rather than tripping the fallback UI: a stray async rejection (feature code
    // already guards its own try/catch) should not blank the entire side panel.
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('WatchDog Error:', error, errorInfo);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled promise rejection', { message: error.message, stack: error.stack });
  };

  handleGlobalError = (event: ErrorEvent) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    logger.error('Uncaught error', { message: error.message, stack: error.stack });
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-screen flex items-center justify-center p-6 bg-background">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={this.handleReset}>Try Again</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
