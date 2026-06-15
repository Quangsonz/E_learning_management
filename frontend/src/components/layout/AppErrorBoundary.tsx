import React from 'react';
import { ErrorState } from '../ui/StateViews';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch() {
    // Intentionally empty: UI fallback only, no business logic changes.
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
          <ErrorState
            title="The interface could not be rendered"
            message="Refresh the page or try again in a moment. The app hit a rendering issue, but your data and logic are untouched."
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;