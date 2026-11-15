declare module "multer" {
  import type { RequestHandler } from "express";

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  interface StorageEngine {
    _handleFile(req: unknown, file: unknown, cb: (error?: Error | null, info?: Partial<File>) => void): void;
    _removeFile(req: unknown, file: File, cb: (error: Error | null) => void): void;
  }

  interface Options {
    storage?: StorageEngine;
    limits?: { fileSize?: number; files?: number };
    fileFilter?: (
      req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void
    ) => void;
  }

  interface Multer {
    single(field: string): RequestHandler;
    array(field: string, maxCount?: number): RequestHandler;
  }

  interface MulterModule {
    (options?: Options): Multer;
    diskStorage(options: {
      destination:
        | string
        | ((req: unknown, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void);
      filename: (req: unknown, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;
    memoryStorage(): StorageEngine;
  }

  const multer: MulterModule;
  export = multer;
}

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination?: string;
      filename?: string;
      path?: string;
      buffer?: Buffer;
    }
  }
}
