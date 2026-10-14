import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="mt-1 text-sm text-rose-700">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <pre className="mt-4 max-h-60 overflow-auto rounded-xl bg-white/80 p-3 text-xs text-rose-800">
            {this.state.error?.stack}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-[#2a234f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1f1a3b]"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
