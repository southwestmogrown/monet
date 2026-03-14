import { describe, it, expect } from "vitest";
import { createVirtualFS } from "@/lib/agent-tools";

describe("createVirtualFS isolation (H-4)", () => {
  it("two instances do not share state", () => {
    const fs1 = createVirtualFS();
    const fs2 = createVirtualFS();

    fs1.write("hello.txt", "from fs1");
    fs2.write("hello.txt", "from fs2");

    expect(fs1.read("hello.txt")).toBe("from fs1");
    expect(fs2.read("hello.txt")).toBe("from fs2");
  });

  it("files written to one instance are not visible in the other", () => {
    const fs1 = createVirtualFS();
    const fs2 = createVirtualFS();

    fs1.write("only-in-fs1.txt", "content");

    expect(fs1.read("only-in-fs1.txt")).toBe("content");
    expect(fs2.read("only-in-fs1.txt")).toBeUndefined();
  });

  it("file lists do not cross-contaminate under concurrent writes", async () => {
    const fs1 = createVirtualFS();
    const fs2 = createVirtualFS();

    // Simulate concurrent writes using Promise.all
    await Promise.all([
      Promise.resolve().then(() => {
        fs1.write("file-a.txt", "alpha");
        fs1.write("file-b.txt", "bravo");
      }),
      Promise.resolve().then(() => {
        fs2.write("file-c.txt", "charlie");
        fs2.write("file-d.txt", "delta");
      }),
    ]);

    const list1 = fs1.list().map((f) => f.path);
    const list2 = fs2.list().map((f) => f.path);

    // Each FS should only contain its own files
    expect(list1.sort()).toEqual(["file-a.txt", "file-b.txt"]);
    expect(list2.sort()).toEqual(["file-c.txt", "file-d.txt"]);

    // Cross-contamination check: no file from fs2 appears in fs1 and vice versa
    for (const path of list2) {
      expect(list1).not.toContain(path);
    }
    for (const path of list1) {
      expect(list2).not.toContain(path);
    }
  });

  it("each createVirtualFS() call starts with an empty store", () => {
    const fs1 = createVirtualFS();
    fs1.write("existing.txt", "data");

    // New instance should be empty regardless of what fs1 contains
    const fs2 = createVirtualFS();

    expect(fs2.list()).toHaveLength(0);
    expect(fs2.read("existing.txt")).toBeUndefined();
  });

  it("read returns undefined for missing files", () => {
    const fs = createVirtualFS();

    expect(fs.read("nonexistent.txt")).toBeUndefined();
  });

  it("write overwrites existing content", () => {
    const fs = createVirtualFS();

    fs.write("file.txt", "original");
    fs.write("file.txt", "updated");

    expect(fs.read("file.txt")).toBe("updated");
    expect(fs.list()).toHaveLength(1);
  });
});
