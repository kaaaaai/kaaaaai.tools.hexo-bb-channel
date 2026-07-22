# BB Deep Links Design

## Objective

Make `hexo-bb-channel` own a complete, shareable deep-link protocol for its asynchronously rendered timeline. A URL such as `/bb/?page=2#bb-123` must load page 2, reveal post `123`, and preserve normal browser navigation. The Blog homepage random-BB entry will consume this protocol without coordinating plugin render timing itself.

## URL contract

- The canonical deep-link shape is `/bb/?page=N#bb-ID`.
- `page` is a positive integer. A missing, malformed, zero, or negative value resolves to page 1.
- A missing hash means normal page navigation.
- Only hashes beginning with `bb-` are treated as BB targets.
- An unknown target does not trigger cross-page searching or show an error. The requested page remains usable.
- Page-number serialization always uses the `page` query parameter and preserves unrelated query parameters.

## Runtime architecture

The existing client renderer remains the single owner of timeline state. Small helpers inside the rendered client script will:

1. Parse the current URL into a normalized page and optional BB target.
2. Load and render that page through the existing `/api/posts` request.
3. After DOM insertion, locate the target by exact element ID.
4. Scroll the target into view and apply a temporary deep-link highlight.
5. Synchronize pagination changes with `history.pushState`.
6. Restore page and target state on `popstate`.

No new runtime dependency or API endpoint is required. The existing card ID format, `bb-${post.id}`, remains the public anchor contract.

## Navigation behavior

Initial load reads both `page` and `hash` before the first request. Once the matching page has rendered, the plugin calls `scrollIntoView` with centered block alignment. Smooth scrolling is used unless `prefers-reduced-motion: reduce` is active.

Clicking a pagination control will:

- update `page=N` using `history.pushState`;
- remove any previous BB hash;
- fetch and render the requested page;
- move the timeline root into view after rendering.

Browser Back and Forward will re-read the URL and load the corresponding page. If the restored URL contains a BB hash, the plugin will locate and highlight that card after rendering. Hash-only navigation on the already loaded page will also be handled so copied anchors and manual hash changes remain useful.

Concurrent navigation is guarded with a monotonically increasing request token. A stale response must not replace a newer page or perform a late scroll/highlight.

## Highlight and accessibility

The matched card receives `data-bb-deep-link-active="true"`. This independent state shares exactly the same border, background, shadow, and offset rules as the existing `data-bb-card-active="true"` selected-card state; the plugin does not introduce a third visual treatment. The temporary deep-link state is removed after 2.4 seconds. On mobile, normal viewport-driven card selection resumes immediately afterward.

The card receives `tabindex="-1"` only when targeted and is focused with `preventScroll` after scrolling, making the destination available to keyboard and assistive-technology users. The temporary tabindex is removed when the highlight ends unless it existed beforehand.

With reduced motion enabled, scrolling is immediate and highlight transitions are disabled. The visible target treatment remains.

## Error handling

- Invalid page parameters fall back to page 1 without rewriting the incoming URL.
- Failed API requests retain the existing status message behavior and do not change history again.
- Missing targets leave the rendered page untouched.
- Stale async responses are ignored.
- PJAX initialization continues to use the existing `data-bb-channel-ready` guard; a newly inserted BB root initializes from its current URL.

## Blog integration

The Blog homepage random-BB component will continue linking to `/bb/?page=1#bb-ID`, because the random endpoint currently samples only the first API page. Its code and tests will formalize that page number as part of a dedicated deep-link builder rather than assembling an incidental string inline.

The Blog does not scroll, highlight, retry, or inspect the BB page DOM. All destination behavior belongs to `hexo-bb-channel`.

If the random API later samples multiple pages, it must return the source page and the Blog builder will serialize that page through the same URL contract.

## Testing

Plugin tests will execute the generated client script in a minimal browser-like harness and cover:

- positive-integer page parsing and invalid-value fallback;
- initial `?page=N#bb-ID` request, post-render targeting, focus, and highlight cleanup;
- pagination history updates and hash removal;
- Back/Forward restoration;
- missing target behavior;
- stale response suppression;
- reduced-motion scrolling.

Existing renderer snapshot-style assertions remain as regression coverage. Blog unit tests will cover the deep-link builder, encoded post IDs, the fixed page-1 contract, and the existing root-home-only behavior. Final verification includes both repositories' test suites and a clean Hexo build against the plugin worktree/package before publication.
