import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Custom error boundary component that catches errors in child components
 * and displays a fallback UI instead of crashing the app
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
                    <pre className="bg-gray-100 p-4 rounded-lg mb-4 max-w-lg overflow-auto text-left text-sm">
                        {this.state.error?.message || 'Unknown error'}
                    </pre>
                    <button
                        onClick={this.resetError}
                        className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
} 