"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "../../components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ConvexErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Convex Error Boundary caught an error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong with Convex queries</h2>
          <div className="bg-red-100 text-red-800 p-4 mb-4 rounded-md">
            <p>Error: {this.state.error?.message}</p>
          </div>
          <p className="mb-4">
            This error may be related to authentication, database access, or missing environment variables. 
            Please check the console logs for more details.
          </p>
          <div className="flex justify-center">
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ConvexErrorBoundary; 