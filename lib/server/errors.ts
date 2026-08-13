import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new AppError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", error.flatten().fieldErrors);
  }
  if (error instanceof SyntaxError) return new AppError(400, "INVALID_JSON", "Nội dung JSON không hợp lệ");
  if (error instanceof Error && error.message === "CART_QUANTITY_EXCEEDED") {
    return new AppError(400, "CART_QUANTITY_EXCEEDED", "Số lượng của một sản phẩm không được vượt quá 99");
  }
  if (error && typeof error === "object") {
    const record = error as { code?: string; cause?: { code?: string } };
    const databaseCode = record.code ?? record.cause?.code;
    if (databaseCode === "23505") return new AppError(409, "CONFLICT", "Dữ liệu đã tồn tại hoặc bị trùng");
    if (databaseCode === "23503") return new AppError(409, "DATA_IN_USE", "Dữ liệu đang được tham chiếu và không thể xóa");
    if (databaseCode === "23514") return new AppError(400, "VALIDATION_ERROR", "Dữ liệu không thỏa điều kiện lưu trữ");
  }
  return new AppError(500, "INTERNAL_ERROR", "Hệ thống đang bận. Vui lòng thử lại sau.");
}
