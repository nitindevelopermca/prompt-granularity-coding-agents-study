// The authenticated app shell's destinations. Products and Cart are the
// only two destinations required by the freeze's required user flow.
// This is intentionally a simple in-memory view switch rather than a URL
// router, since the shell does not need deep-linking for this work unit.
export type AppView = 'products' | 'cart';
