export const config = {
  port: Number(process.env.PORT ?? 3000),
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
};
