import express from "express";
import { notFoundHandler } from "./middleware/not-found";
import { errorHandler } from "./middleware/error-handler";

export const app = express();

app.use(express.json());

app.get("/health", (__req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

app.use(notFoundHandler);
app.use(errorHandler);