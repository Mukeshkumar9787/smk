export interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number; // remaining seconds
  message: string;
  endpoint?: string;
}

type Listener = (state: RateLimitState) => void;

class RateLimitManager {
  private state: RateLimitState = {
    isRateLimited: false,
    retryAfter: 0,
    message: "",
    endpoint: undefined,
  };

  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();

  public getState(): RateLimitState {
    return { ...this.state };
  }

  public isRateLimited(): boolean {
    return this.state.isRateLimited;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error("[RateLimitManager] Listener error:", err);
      }
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("rate-limit-updated", { detail: currentState })
      );
    }
  }

  /**
   * Activates rate limit cooldown with live countdown.
   */
  public trigger(params: { retryAfter?: number; message?: string; endpoint?: string }) {
    const retryAfter = Math.max(1, params.retryAfter || 60);
    const message =
      params.message ||
      `Please wait ${retryAfter} seconds before trying again.`;

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.state = {
      isRateLimited: true,
      retryAfter,
      message,
      endpoint: params.endpoint,
    };
    this.notify();

    this.timer = setInterval(() => {
      if (this.state.retryAfter <= 1) {
        this.clear();
      } else {
        this.state = {
          ...this.state,
          retryAfter: this.state.retryAfter - 1,
        };
        this.notify();
      }
    }, 1000);
  }

  /**
   * Clears the active rate limit state.
   */
  public clear() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state = {
      isRateLimited: false,
      retryAfter: 0,
      message: "",
      endpoint: undefined,
    };
    this.notify();
  }

  public dismiss() {
    this.clear();
  }
}

export const rateLimitManager = new RateLimitManager();

