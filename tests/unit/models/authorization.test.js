import { InternalServerError } from "infra/errors";
import authorization from "models/authorization";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("Without user", () => {
      expect(authorization.can).toThrow(InternalServerError);
    });

    test("Without user.features", () => {
      const createdUser = {};

      expect(() => authorization.can(createdUser)).toThrow(InternalServerError);
    });

    test("Without feature", () => {
      const createdUser = { features: ["test"] };

      expect(() => authorization.can(createdUser)).toThrow(InternalServerError);
    });

    test("With unknow feature", () => {
      const createdUser = { features: ["test"] };
      const feature = "unknow:feature";

      expect(() => authorization.can(createdUser, feature)).toThrow(
        InternalServerError,
      );
    });

    test("With valid user and feature", () => {
      const createdUser = { features: ["read:user"] };
      const feature = "read:user";

      expect(authorization.can(createdUser, feature)).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("Without user", () => {
      expect(authorization.filterOutput).toThrow(InternalServerError);
    });

    test("Without user.features", () => {
      const createdUser = {};

      expect(() => authorization.filterOutput(createdUser)).toThrow(
        InternalServerError,
      );
    });

    test("Without feature", () => {
      const createdUser = { features: ["test"] };

      expect(() => authorization.filterOutput(createdUser)).toThrow(
        InternalServerError,
      );
    });

    test("With unknow feature", () => {
      const createdUser = { features: ["test"] };
      const feature = "unknow:feature";

      expect(() => authorization.filterOutput(createdUser, feature)).toThrow(
        InternalServerError,
      );
    });

    test("With valid user, known feature but no resource", () => {
      const createdUser = { features: ["read:user"] };
      const feature = "read:user";

      expect(() => authorization.filterOutput(createdUser, feature)).toThrow(
        InternalServerError,
      );
    });

    test("With valid user, known feature and resouce", () => {
      const createdUser = { features: ["read:user"] };
      const feature = "read:user";
      const resouce = {
        id: 1,
        username: "resouce",
        features: ["read:user"],
        created_at: "2026-02-09T18:16:11.616Z",
        updated_at: "2026-02-09T18:16:11.616Z",
        email: "resouce@gmail.com",
        password: "password",
      };

      expect(authorization.filterOutput(createdUser, feature, resouce)).toEqual(
        {
          id: 1,
          username: "resouce",
          features: ["read:user"],
          created_at: "2026-02-09T18:16:11.616Z",
          updated_at: "2026-02-09T18:16:11.616Z",
        },
      );
    });
  });
});
