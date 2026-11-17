import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { createUserSchema, updateNotificationPreferencesSchema } from "../shared/schema";

const baseUser = {
  firstName: "Test",
  lastName: "Account",
  email: "account@example.test",
};

// Exercise the actual storage method with a fake database: no accounts or
// invitation emails are created by these tests.
const source = readFileSync(new URL("../server/storage.ts", import.meta.url), "utf8");
const ast = ts.createSourceFile("storage.ts", source, ts.ScriptTarget.Latest, true);
let createMethod: ts.MethodDeclaration | undefined;
for (const statement of ast.statements) {
  if (!ts.isClassDeclaration(statement)) continue;
  for (const member of statement.members) {
    if (ts.isMethodDeclaration(member) && member.name.getText(ast) === "createUser") {
      createMethod = member;
    }
  }
}
assert.ok(createMethod, "Production createUser method must exist");
const methodJs = ts.transpileModule(
  `class Storage { ${createMethod.getText(ast)} }\nreturn new Storage();`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
).outputText;

for (const disabled of [undefined, false, true]) {
  test(`creation persists every preference with disableNotifications=${disabled}`, async () => {
    const input = createUserSchema.parse({
      ...baseUser,
      ...(disabled === undefined ? {} : { disableNotifications: disabled }),
    });
    let inserted: Record<string, unknown> = {};
    const db = {
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          inserted = values;
          return { returning: async () => [values] };
        },
      }),
    };
    const storage = new Function("db", "users", "bcrypt", "nanoid", methodJs)(
      db, {}, { hash: async () => "test-hash" }, () => "test-id",
    );
    const result = await storage.createUser(input);
    for (const key of ["emailNotifications", "documentNotifications", "pushNotifications", "loginNotifications"]) {
      assert.equal(inserted[key], disabled !== true, key);
      assert.equal(result.user[key], disabled !== true, key);
    }
  });
}

test("creation rejects non-boolean notification options", () => {
  assert.equal(createUserSchema.safeParse({ ...baseUser, disableNotifications: "false" }).success, false);
});

test("the existing profile API permits enabling notifications again", () => {
  const preferences = {
    emailNotifications: true,
    documentNotifications: true,
    pushNotifications: true,
    loginNotifications: true,
  };
  assert.deepEqual(updateNotificationPreferencesSchema.parse(preferences), preferences);
});
