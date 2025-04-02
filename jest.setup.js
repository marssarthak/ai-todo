// jest.setup.js
import "@testing-library/jest-dom";

// Mock the window.matchMedia function for components that use media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver for components that use it (like lazy loading)
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}

window.IntersectionObserver = MockIntersectionObserver;

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    ok: true,
  })
);

// Mock Supabase client functions
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      then: jest
        .fn()
        .mockImplementation((callback) =>
          Promise.resolve(callback({ data: [], error: null }))
        ),
    }),
    rpc: jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: null, error: null })),
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      getSession: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: { session: null }, error: null })
        ),
      getUser: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: { user: null }, error: null })
        ),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest
          .fn()
          .mockReturnValue({
            data: { publicUrl: "https://example.com/image.jpg" },
          }),
      }),
    },
  }),
}));

// Add a global performance mock for browsers that don't support the performance API
if (typeof window.performance !== "object") {
  window.performance = {
    now: jest.fn(() => Date.now()),
  };
}

// Add a global localStorage mock
if (typeof window.localStorage !== "object") {
  const localStorageMock = (function () {
    let store = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
}

// Mock the Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: jest.fn().mockReturnValue("/"),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

// Silence console messages during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockClear();
});
