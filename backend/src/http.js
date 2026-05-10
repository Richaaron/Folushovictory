export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFound(req, res) {
  res.status(404).json({ error: "Not Found" });
}

export function errorHandler(err, req, res, next) {
  const status = Number(err.statusCode || 500);
  const message = status >= 500 ? "Server Error" : err.message || "Error";
  res.status(status).json({ error: message });
}

