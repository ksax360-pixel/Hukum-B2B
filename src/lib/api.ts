import { NextResponse } from "next/server";

export type ApiBody<T = unknown> = {
  success: boolean;
  data: T | null;
  message: string;
  error: string | null;
};

export function ok<T>(data: T, message = "", status = 200) {
  return NextResponse.json(
    { success: true, data, message, error: null } satisfies ApiBody<T>,
    { status }
  );
}

export function fail(message: string, status = 400, error: string | null = message) {
  return NextResponse.json(
    { success: false, data: null, message, error } satisfies ApiBody,
    { status }
  );
}
