"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            Xin lỗi, đã có lỗi xảy ra khi hiển thị nội dung này. Vui lòng thử lại.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="text-left text-sm bg-muted p-4 rounded-md mb-4 max-w-lg overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <Button onClick={this.handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// HOOK FOR ERROR BOUNDARY RESET
// ============================================

export function useErrorBoundary() {
  const resetErrorBoundary = () => {
    // This is a placeholder - in a real app, you'd use a context
    // or state management to trigger a reset
    window.location.reload();
  };

  return { resetErrorBoundary };
}

// ============================================
// COMPACT ERROR DISPLAY
// ============================================

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorDisplay({
  title = "Đã xảy ra lỗi",
  message = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  compact = false,
}: ErrorDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 p-2">
        <AlertTriangle className="h-4 w-4" />
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-primary hover:underline font-medium"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-3 w-3 mr-1" />
          Thử lại
        </Button>
      )}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && (
        <div className="text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
