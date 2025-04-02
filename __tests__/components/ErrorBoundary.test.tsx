import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Mock console.error to prevent test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing the ErrorBoundary
const ErrorThrowingComponent = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Component Content</div>;
};

describe("ErrorBoundary", () => {
  it("renders children when there are no errors", () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders fallback UI when children throw errors", () => {
    // Suppress React's error boundary console spam during tests
    const spy = jest.spyOn(console, "error");
    spy.mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Default fallback should be shown
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();

    spy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    // Suppress React's error boundary console spam during tests
    const spy = jest.spyOn(console, "error");
    spy.mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error UI")).toBeInTheDocument();

    spy.mockRestore();
  });

  it("calls onError callback when an error occurs", () => {
    // Suppress React's error boundary console spam during tests
    const spy = jest.spyOn(console, "error");
    spy.mockImplementation(() => {});

    const handleError = jest.fn();

    render(
      <ErrorBoundary onError={handleError}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.anything()
    );

    spy.mockRestore();
  });

  it('resets the error state when "Try again" button is clicked', () => {
    // Suppress React's error boundary console spam during tests
    const spy = jest.spyOn(console, "error");
    spy.mockImplementation(() => {});

    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      // This effect simulates fixing the error condition after the first render
      React.useEffect(() => {
        setShouldThrow(false);
      }, []);

      return <ErrorThrowingComponent shouldThrow={shouldThrow} />;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Initially the error boundary should show the error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click the "Try again" button
    fireEvent.click(screen.getByText("Try again"));

    // Now the component should render successfully
    expect(screen.getByText("Component Content")).toBeInTheDocument();

    spy.mockRestore();
  });
});
