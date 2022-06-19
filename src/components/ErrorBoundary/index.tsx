import { Component } from 'react';
import Custom500 from 'src/pages/500';
import * as Sentry from '@sentry/nextjs';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error) {
    Sentry.captureException(error);
  }
  render() {
    if (this.state.hasError) {
      return <Custom500 />
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
