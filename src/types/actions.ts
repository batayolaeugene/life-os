export type ActionResponse<T = void> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };
