# CMS page section registry

Page section types are configured in a single registry so validation, the admin editor, and HTML rendering stay in sync.
The registry lives in `src/modules/cms/page-section-registry.ts`.

## Adding a new section type

1. **Update the enum**
   - Add the new value to `PageSectionType` in `prisma/schema.prisma` and run the Prisma migration.

2. **Extend the registry** (`src/modules/cms/page-section-registry.ts`)
   - Add a Zod schema for the new type.
   - Add a renderer that returns the HTML for the new section.
   - Add editor defaults, an editor builder, and a validator function under `pageSectionRegistry`.

3. **Update tests / fixtures**
   - If the new type affects API validation, add or update test cases in
     `src/modules/cms/__tests__/page-sections.schemas.test.ts` and relevant e2e tests.

4. **Verify the admin editor**
   - The admin editor uses the registry-generated script in
     `src/modules/cms/admin-ui.routes.ts`, so no extra wiring should be necessary.

Keeping the registry complete ensures the validation pipeline, admin editor, and rendering
stay aligned for every section type.
