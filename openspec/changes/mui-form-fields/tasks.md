## 1. Dependencies and theme

- [ ] 1.1 Add `@mui/material`, `@emotion/react`, `@emotion/styled`, and `@mui/stylis-plugin-rtl` to `package.json` and verify `npm install` succeeds
- [ ] 1.2 Create `src/theme/muiTheme.js` with `createAppTheme(dark)` using teal/stone/error tokens from design.md and verify the module exports without lint errors
- [ ] 1.3 Create `src/theme/rtlCache.js` with Emotion RTL cache using `@mui/stylis-plugin-rtl` and verify the module exports without lint errors

## 2. App providers

- [ ] 2.1 Wrap app content in `App.jsx` with MUI `CacheProvider`, `ThemeProvider`, and `CssBaseline`, driven by the existing dark-mode state, and verify `npm run build` passes
- [ ] 2.2 Browser-check: load the app in light and dark mode and confirm no layout regression on the page shell outside form fields

## 3. Shared field components (`ui.jsx`)

- [ ] 3.1 Re-implement `Field` to pass label, hint, required, error, and afterLabel to its child via cloneElement/context, and verify existing call sites still compile
- [ ] 3.2 Re-implement `Input` as MUI outlined `TextField`, mapping `invalid` to `error` and preserving all native input props, and verify `npm run lint` passes
- [ ] 3.3 Re-implement `Textarea` as MUI outlined multiline `TextField` with `rows` support and verify `npm run lint` passes
- [ ] 3.4 Re-implement `Select` as MUI outlined `TextField select`, mapping `<option>` children to `MenuItem`, and verify `npm run lint` passes
- [ ] 3.5 Re-implement `Checkbox` with MUI `Checkbox` + `FormControlLabel` and teal checked styling, and verify `npm run lint` passes
- [ ] 3.6 Confirm `GhostButton`, `DeleteButton`, `GhostAddRow`, and `invalidCell` remain Tailwind-based and unchanged

## 4. Validation and helper text behaviour

- [ ] 4.1 Wire `Field` hint to MUI `helperText` when no error is present, and error string to `helperText` + `error` when present, and verify hint hides when error shows (browser: optional workflow description field with hint)
- [ ] 4.2 Verify required asterisk shows before first "צור אפיון" and inline errors appear only after first generate press, then clear live on fix (browser: empty "שם הלקוח" in AdminSection)

## 5. Section browser verification

- [ ] 5.1 Browser-check AdminSection: outlined fields, RTL text entry, required markers, post-submit errors on client name / PM name
- [ ] 5.2 Browser-check BusinessSection: multiline "המטרה העסקית" validation and helper/error text below field
- [ ] 5.3 Browser-check WorkflowHeader: select trigger type opens RTL menu; text fields outlined
- [ ] 5.4 Browser-check HttpBlock + SecurityFields: select, text inputs, security checkboxes in light and dark mode
- [ ] 5.5 Browser-check MappingTable or HeadersEditor: confirm `.cell-input` borderless table inputs unchanged
- [ ] 5.6 Browser-check PayloadEditor: confirm dark monospace JSON editor unchanged

## 6. Final verification

- [ ] 6.1 Run `npm run lint` and `npm run build` and confirm both pass
- [ ] 6.2 Fill a minimal valid form, export, and confirm compiled JSON shape and values are unchanged (schemaVersion still 4)
