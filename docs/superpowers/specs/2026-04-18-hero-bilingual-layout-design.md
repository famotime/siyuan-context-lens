# Hero Bilingual Brand And Tagline Layout Design

## Summary

Adjust the top hero area so the brand label and main title intentionally display the opposite language of the current UI locale, while the descriptive tagline continues to follow the current UI locale. At the same time, separate the tagline into its own full-width row so it no longer inherits the narrow width constraints of the left-side title block.

## Goals

- Show the opposite-language brand text in the hero eyebrow and main title.
- Keep the tagline localized in the current UI language.
- Make the tagline occupy a full-width line below the hero header row.
- Preserve the existing icon and top-right action buttons.
- Keep the change small, explicit, and covered by regression tests.

## Non-goals

- Do not change plugin naming in top bar, settings, or other UI entry points.
- Do not change the meaning of existing locale resolution for general UI copy.
- Do not redesign the broader page layout outside the hero area.
- Do not introduce a generic multilingual layout system for unrelated components.

## Current Problem

The current hero area resolves `pluginEyebrow`, `pluginTitle`, and `pluginTagline` through the same locale path. This means all three strings follow the active UI language. The tagline is also rendered inside the same left-side copy block as the eyebrow and title, so it is visually constrained by that block instead of using the full available row width.

## Proposed Approach

### 1. Opposite-language brand helper

Add a dedicated helper in `src/i18n/plugin.ts` for brand-facing hero text that returns the opposite locale variant for selected plugin text keys.

Rules:

- `pluginEyebrow` uses the opposite locale.
- `pluginTitle` uses the opposite locale.
- `pluginTagline` still uses the active locale and continues to use the existing helper path.
- `pluginIconAlt` remains active-locale text for accessibility.

This keeps the reversal rule scoped to the hero branding use case instead of scattering locale inversion logic in `App.vue`.

### 2. Hero layout split into header row plus tagline row

Restructure the top hero markup into two layers:

- Header row: left-side intro content and icon, plus right-side actions.
- Tagline row: one standalone full-width text block below the header row.

The eyebrow and title stay grouped with the icon as the compact brand header. The tagline moves outside the narrow copy block and becomes a sibling row under the header container.

### 3. Styling changes

Update hero styles so that:

- the hero container is a vertical stack;
- the first row still supports the current left/right alignment for intro content and actions;
- the second row spans the full width;
- the tagline no longer has a `max-width` tied to the title block;
- mobile behavior still collapses cleanly under the existing responsive breakpoint.

The visual style should otherwise stay consistent with the current hero treatment.

## Component And File Impact

### `src/i18n/plugin.ts`

- Add an opposite-locale helper for selected plugin text keys.
- Keep current locale-based helpers intact for other call sites.

### `src/App.vue`

- Switch `pluginEyebrow` and `pluginTitle` to the new opposite-locale helper.
- Keep `pluginTagline` on the current helper.
- Move the tagline markup out of `hero__copy-block`.
- Introduce a hero header wrapper and a standalone tagline block.
- Update scoped styles for the new structure.

### `src/App.test.ts`

Add regression coverage that asserts:

- `App.vue` uses the new opposite-language brand helper for eyebrow and title.
- `pluginTagline` still uses the current-locale helper.
- the tagline is no longer inside `hero__copy-block`.
- the hero layout includes a dedicated full-width tagline section.

## Data Flow And Behavior

1. UI locale is resolved the same way as today.
2. `pluginEyebrow` and `pluginTitle` request brand text through the opposite-locale helper.
3. `pluginTagline` requests text through the current-locale helper.
4. The template renders title content in the header row and tagline content in the row below.

Example:

- In `zh_CN`, eyebrow/title show English, tagline shows Chinese.
- In `en_US`, eyebrow/title show Chinese, tagline shows English.

## Error Handling

The new helper should reuse the existing locale normalization rules. If an unexpected locale is encountered, behavior should continue to fall back consistently to the existing English-default path rather than introducing a new fallback branch.

## Testing Strategy

Follow test-first implementation:

1. Extend `src/App.test.ts` with a failing regression test that describes the new hero contract.
2. Run the targeted Vitest file and verify the new test fails for the expected reason.
3. Implement the helper and hero layout updates.
4. Re-run the targeted test until it passes.
5. Run the full test suite and build before closing the task.

## Risks And Mitigations

- Risk: future contributors may assume all plugin text follows the active locale.
  Mitigation: keep the opposite-language behavior isolated in a clearly named helper and document it through tests.

- Risk: moving the tagline may break responsive spacing.
  Mitigation: keep the structural change minimal and verify under the existing mobile breakpoint styles.

- Risk: accessibility text could accidentally become opposite-language too.
  Mitigation: leave `pluginIconAlt` on the active locale helper and explicitly call that out in code and tests.

## Open Decisions Resolved

- Only the hero eyebrow and hero title use opposite-language text.
- The tagline remains active-locale text.
- The tagline becomes a standalone full-width row, not part of the left copy block.

## Implementation Readiness

This design is intentionally narrow and can be implemented in one small pass with one regression test file, one i18n helper update, and one hero layout/style update.
