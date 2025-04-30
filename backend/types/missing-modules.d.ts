declare module 'cors' {
  import { RequestHandler } from 'express';
  function cors(options?: object): RequestHandler;
  export = cors;
}

declare module 'morgan' {
  import { RequestHandler } from 'express';
  function morgan(format: string, options?: object): RequestHandler;
  export = morgan;
}

declare module 'formidable' {
  export interface Fields {
    [key: string]: string[];
  }
  
  export interface Files {
    [key: string]: {
      filepath: string;
      [key: string]: any;
    }[];
  }
  
  export class IncomingForm {
    constructor(options?: { keepExtensions?: boolean; [key: string]: any });
    parse(req: any, callback: (err: Error | null, fields: Fields, files: Files) => void): void;
  }
}

declare module './lib/firebase-admin' {
  import { Firestore } from 'firebase-admin/firestore';
  export const adminDb: Firestore;
}

// Using a different approach for module declarations to avoid duplicate identifier errors

declare module './api/about/aboutRoutes' {
  import express from 'express';
  const _router: express.Router;
  export default _router;
}

declare module './api/ingredients/ingredientsRoutes' {
  import express from 'express';
  const _router: express.Router;
  export default _router;
}

declare module './api/ingredients/analyze/analyzeRoutes' {
  import express from 'express';
  const _router: express.Router;
  export default _router;
}

declare module './api/ingredients/extract/extractRoutes' {
  import express from 'express';
  const _router: express.Router;
  export default _router;
}

declare module './api/about/seed/seedRoutes' {
  import express from 'express';
  const _router: express.Router;
  export default _router;
}
