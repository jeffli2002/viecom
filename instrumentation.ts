export function register() {
  process.on('uncaughtException', (error) => {
    console.error('[instrumentation] uncaughtException', error);
  });

  process.on('unhandledRejection', (reason) => {
    console.error(
      '[instrumentation] unhandledRejection',
      reason instanceof Error ? reason : String(reason)
    );
  });
}
