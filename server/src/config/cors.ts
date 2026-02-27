import cors from "cors";
import { ENV } from "./env";

export const corsOptions: cors.CorsOptions = {
  origin: ENV.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};
