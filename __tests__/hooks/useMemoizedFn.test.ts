import { renderHook } from "@testing-library/react";
import { useMemoizedFn } from "@/hooks/useMemoizedFn";

describe("useMemoizedFn", () => {
  it("should return a memoized function", () => {
    // Define the function to memoize
    const fn = jest.fn(() => "test");

    // Render the hook
    const { result, rerender } = renderHook(() => useMemoizedFn(fn));

    // Get the memoized function
    const memoizedFn = result.current;

    // Call the memoized function
    expect(memoizedFn()).toBe("test");
    expect(fn).toHaveBeenCalledTimes(1);

    // Store the function reference
    const firstFunction = result.current;

    // Rerender to simulate a component update
    rerender();

    // Ensure the function reference is stable
    expect(result.current).toBe(firstFunction);

    // Call the memoized function again
    const value = result.current();
    expect(value).toBe("test");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should update when function implementation changes but preserve the function reference", () => {
    // Create a stateful function to test changes
    let multiplier = 2;
    const fn = jest.fn((x: number) => x * multiplier);

    // Render the hook with the initial function
    const { result, rerender } = renderHook(() => useMemoizedFn(fn));

    // Call the initial function
    expect(result.current(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);

    // Store the function reference
    const firstFunction = result.current;

    // Change the function implementation
    multiplier = 3;

    // Rerender to simulate a component update
    rerender();

    // Ensure the function reference is stable
    expect(result.current).toBe(firstFunction);

    // Call the memoized function again - should use the updated implementation
    expect(result.current(5)).toBe(15);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should pass all arguments correctly", () => {
    // Function that takes multiple arguments
    const fn = jest.fn((a: string, b: number, c: boolean) => ({ a, b, c }));

    // Render the hook
    const { result } = renderHook(() => useMemoizedFn(fn));

    // Call with multiple arguments
    expect(result.current("test", 42, true)).toEqual({
      a: "test",
      b: 42,
      c: true,
    });
    expect(fn).toHaveBeenCalledWith("test", 42, true);
  });

  it("should preserve the function instance when dependencies change", () => {
    // Define a component with changing dependencies
    const { result, rerender } = renderHook(
      ({ text }) => {
        const callback = useMemoizedFn(() => text);
        return callback;
      },
      { initialProps: { text: "initial" } }
    );

    // Initial call
    expect(result.current()).toBe("initial");

    // Store the function reference
    const firstCallback = result.current;

    // Update the dependency
    rerender({ text: "updated" });

    // Function identity should be preserved
    expect(result.current).toBe(firstCallback);

    // But it should use the new value
    expect(result.current()).toBe("updated");
  });

  it("should handle function with context correctly", () => {
    // Create a function that uses 'this'
    function createCounter() {
      return {
        count: 0,
        increment: function () {
          this.count += 1;
          return this.count;
        },
      };
    }

    // Render the hook with a method that uses 'this'
    const { result } = renderHook(() => {
      const counter = createCounter();
      const incrementFn = useMemoizedFn(counter.increment.bind(counter));
      return { counter, incrementFn };
    });

    // Call the memoized method
    expect(result.current.incrementFn()).toBe(1);
    expect(result.current.incrementFn()).toBe(2);
    expect(result.current.counter.count).toBe(2);
  });

  it("should handle async functions", async () => {
    // Create an async function
    const asyncFn = jest.fn(async (x: number) => {
      return Promise.resolve(x * 2);
    });

    // Render the hook
    const { result } = renderHook(() => useMemoizedFn(asyncFn));

    // Call the memoized async function
    const promise = result.current(5);
    expect(promise).toBeInstanceOf(Promise);

    // Await the result
    const value = await promise;
    expect(value).toBe(10);
    expect(asyncFn).toHaveBeenCalledWith(5);
  });
});
