const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="text-center">
      <h1 className="mb-2 text-4xl font-bold">404</h1>
      <p className="mb-4 text-sm text-muted-foreground">This page doesn't exist.</p>
      <a href="/" className="text-sm underline underline-offset-4">
        Back to DailyD
      </a>
    </div>
  </div>
);

export default NotFound;
