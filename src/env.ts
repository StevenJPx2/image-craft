try {
  process.loadEnvFile(".env");
} catch {
  // Environment files are optional; deployment environments may inject variables directly.
}
