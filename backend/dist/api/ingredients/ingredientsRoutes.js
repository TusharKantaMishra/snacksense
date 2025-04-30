"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Import ingredient route modules
const analyzeRoutes_1 = __importDefault(require("./analyze/analyzeRoutes"));
const extractRoutes_1 = __importDefault(require("./extract/extractRoutes"));
// Set up the routes
router.use('/analyze', analyzeRoutes_1.default);
router.use('/extract', extractRoutes_1.default);
exports.default = router;
//# sourceMappingURL=ingredientsRoutes.js.map