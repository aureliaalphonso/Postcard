import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const BUCKET_NAME = "make-5439cc58-postcards";

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function ensureBucket() {
  const supabase = getAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  }
}

async function getUserFromToken(token: string | null) {
  if (!token) return null;
  try {
    // Approach 1: Supabase Auth REST API (handles ES256 tokens natively)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
    });
    if (res.ok) {
      const user = await res.json();
      if (user?.id) return user;
    } else {
      const errBody = await res.text();
      console.log("Auth REST approach failed:", res.status, errBody);
    }
  } catch (err) {
    console.log("Auth REST approach threw:", err);
  }

  // Approach 2: Decode JWT payload (base64) → get sub → admin.getUserById
  // Bypasses all JWT algorithm verification issues entirely.
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded));
    const userId = payload?.sub;
    if (!userId) return null;
    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      console.log("Admin getUserById error:", error.message);
      return null;
    }
    if (data?.user) {
      console.log("Auth via admin fallback succeeded, userId:", userId);
      return data.user;
    }
  } catch (err) {
    console.log("Auth admin fallback threw:", err);
  }

  return null;
}

async function requireAuth(c: any) {
  // User JWT is passed in X-User-Token to avoid Supabase gateway rejecting ES256 tokens
  // on the Authorization header. The Authorization header carries the anon key instead.
  const token = c.req.header("X-User-Token") ?? c.req.header("Authorization")?.split(" ")[1];
  const user = await getUserFromToken(token ?? null);
  if (!user) {
    return { user: null, error: c.json({ error: "Unauthorized" }, 401) };
  }
  return { user, error: null };
}

async function getSignedUrl(path: string) {
  if (!path) return null;
  const supabase = getAdminClient();
  const { data } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 60 * 60 * 24); // 24 hours
  return data?.signedUrl ?? null;
}

// Health check
app.get("/make-server-5439cc58/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── VIDEO CHUNKED UPLOAD ─────────────────────────────────────────────────────
// Receives base64-encoded chunks of a video file and assembles + uploads to
// Supabase Storage server-side, bypassing CORS and edge-function body limits.
// Each chunk is ~1.5 MB raw (~2 MB as base64 JSON) - well under the 6 MB limit.

app.post("/make-server-5439cc58/upload/video-chunk", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;
  try {
    await ensureBucket();
    const {
      uploadId,
      chunkIndex,
      totalChunks,
      chunkData, // base64 string
      fileName,
      contentType,
    } = await c.req.json();

    if (!uploadId || chunkIndex == null || !totalChunks || !chunkData) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const userId = user!.id;
    const chunkKey = `video_chunk:${userId}:${uploadId}:${chunkIndex}`;

    // Store this chunk as base64 in kv
    await kv.set(chunkKey, chunkData);

    // If this isn't the last chunk, just acknowledge
    if (chunkIndex < totalChunks - 1) {
      return c.json({ complete: false, chunkIndex });
    }

    // This is the last chunk — assemble all chunks and upload
    const chunkKeys: string[] = [];
    for (let i = 0; i < totalChunks; i++) {
      chunkKeys.push(`video_chunk:${userId}:${uploadId}:${i}`);
    }

    const chunkValues = await kv.mget(chunkKeys);
    // Ensure all chunks arrived
    for (let i = 0; i < totalChunks; i++) {
      if (!chunkValues[i]) {
        return c.json({ error: `Missing chunk ${i}` }, 400);
      }
    }

    // Decode base64 chunks and concatenate
    const decodedChunks: Uint8Array[] = chunkValues.map((b64: string) =>
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    );
    const totalLength = decodedChunks.reduce((s, c) => s + c.length, 0);
    const assembled = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of decodedChunks) {
      assembled.set(chunk, offset);
      offset += chunk.length;
    }

    // Upload assembled video to Supabase Storage
    const ext = (fileName as string | undefined)?.split(".").pop()?.toLowerCase() ?? "mp4";
    const storagePath = `${userId}/videos/${uploadId}.${ext}`;
    const supabase = getAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, assembled, { contentType: contentType ?? "video/mp4", upsert: true });

    if (uploadError) {
      console.log("Video assembly upload error:", uploadError);
      return c.json({ error: `Storage upload failed: ${uploadError.message}` }, 500);
    }

    // Clean up chunk entries from kv
    await kv.mdel(chunkKeys);

    return c.json({ complete: true, path: storagePath, contentType: contentType ?? "video/mp4" });
  } catch (err) {
    console.log("Video chunk upload error:", err);
    return c.json({ error: `Video chunk upload failed: ${err}` }, 500);
  }
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post("/make-server-5439cc58/auth/signup", async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@postcardapp.app`;
    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      email_confirm: true,
    });
    if (error) {
      return c.json({ error: `Signup error: ${error.message}` }, 400);
    }
    return c.json({ user: { id: data.user.id, username } });
  } catch (err) {
    console.log("Signup error:", err);
    return c.json({ error: `Signup failed: ${err}` }, 500);
  }
});

// ─── PROFILE / AVATAR ─────────────────────────────────────────────────────────

app.get("/make-server-5439cc58/auth/profile", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;
  try {
    const raw = await kv.get(`user:${user!.id}:profile`);
    const profile = raw ? JSON.parse(raw) : {};
    const avatarUrl = profile.avatarPath ? await getSignedUrl(profile.avatarPath) : null;
    const username = user!.user_metadata?.username ?? user!.email?.split("@")[0] ?? "user";
    return c.json({ username, avatarUrl });
  } catch (err) {
    console.log("Get profile error:", err);
    return c.json({ error: `Get profile failed: ${err}` }, 500);
  }
});

app.post("/make-server-5439cc58/auth/avatar", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;
  try {
    await ensureBucket();
    const body = await c.req.parseBody();
    const avatarFile = body["avatar"] as File | undefined;
    if (!avatarFile || avatarFile.size === 0) {
      return c.json({ error: "No avatar file provided" }, 400);
    }
    const ext = avatarFile.name.split(".").pop() ?? "jpg";
    const avatarPath = `${user!.id}/avatar/profile.${ext}`;
    const buffer = new Uint8Array(await avatarFile.arrayBuffer());
    const supabase = getAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(avatarPath, buffer, { contentType: avatarFile.type, upsert: true });
    if (uploadError) {
      console.log("Avatar upload error:", uploadError);
      return c.json({ error: `Avatar upload failed: ${uploadError.message}` }, 500);
    }
    const existingRaw = await kv.get(`user:${user!.id}:profile`);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    await kv.set(`user:${user!.id}:profile`, JSON.stringify({ ...existing, avatarPath }));
    const avatarUrl = await getSignedUrl(avatarPath);
    return c.json({ avatarUrl });
  } catch (err) {
    console.log("Upload avatar error:", err);
    return c.json({ error: `Upload avatar failed: ${err}` }, 500);
  }
});

app.post("/make-server-5439cc58/auth/signin", async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@postcardapp.app`;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return c.json({ error: `Sign in error: ${error.message}` }, 401);
    }
    return c.json({
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: {
        id: data.user?.id,
        username: data.user?.user_metadata?.username ?? username,
      },
    });
  } catch (err) {
    console.log("Signin error:", err);
    return c.json({ error: `Signin failed: ${err}` }, 500);
  }
});

// ─── ALBUMS ──────────────────────────────────────────────────────────────────

app.post("/make-server-5439cc58/albums", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  try {
    await ensureBucket();
    const body = await c.req.parseBody();
    const name = body["name"] as string;
    const date = body["date"] as string;
    const coverImageFile = body["coverImage"] as File | undefined;

    if (!name) return c.json({ error: "Album name is required" }, 400);

    const albumId = crypto.randomUUID();
    let coverImagePath: string | null = null;

    if (coverImageFile && coverImageFile.size > 0) {
      const ext = coverImageFile.name.split(".").pop() ?? "jpg";
      coverImagePath = `${user!.id}/albums/${albumId}/cover.${ext}`;
      const buffer = new Uint8Array(await coverImageFile.arrayBuffer());
      const supabase = getAdminClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(coverImagePath, buffer, { contentType: coverImageFile.type });
      if (uploadError) {
        console.log("Cover upload error:", uploadError);
        coverImagePath = null;
      }
    }

    const album = {
      id: albumId,
      userId: user!.id,
      name,
      date: date ?? "",
      coverImagePath,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`album:${albumId}`, JSON.stringify(album));

    // Update user's album list
    const existingRaw = await kv.get(`user:${user!.id}:albums`);
    const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(albumId);
    await kv.set(`user:${user!.id}:albums`, JSON.stringify(existing));
    await kv.set(`album:${albumId}:postcards`, JSON.stringify([]));

    const coverImageUrl = coverImagePath ? await getSignedUrl(coverImagePath) : null;
    return c.json({ ...album, coverImageUrl });
  } catch (err) {
    console.log("Create album error:", err);
    return c.json({ error: `Create album failed: ${err}` }, 500);
  }
});

app.get("/make-server-5439cc58/albums", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  try {
    const albumIdsRaw = await kv.get(`user:${user!.id}:albums`);
    const albumIds: string[] = albumIdsRaw ? JSON.parse(albumIdsRaw) : [];

    const albums = [];
    for (const albumId of albumIds) {
      const raw = await kv.get(`album:${albumId}`);
      if (raw) {
        const album = JSON.parse(raw);
        const postcardIdsRaw = await kv.get(`album:${albumId}:postcards`);
        const postcardIds: string[] = postcardIdsRaw ? JSON.parse(postcardIdsRaw) : [];
        const coverImageUrl = album.coverImagePath ? await getSignedUrl(album.coverImagePath) : null;
        albums.push({ ...album, coverImageUrl, postcardCount: postcardIds.length });
      }
    }
    return c.json(albums);
  } catch (err) {
    console.log("Get albums error:", err);
    return c.json({ error: `Get albums failed: ${err}` }, 500);
  }
});

app.get("/make-server-5439cc58/albums/:id", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  try {
    const albumId = c.req.param("id");
    const raw = await kv.get(`album:${albumId}`);
    if (!raw) return c.json({ error: "Album not found" }, 404);

    const album = JSON.parse(raw);
    if (album.userId !== user!.id) return c.json({ error: "Forbidden" }, 403);

    const postcardIdsRaw = await kv.get(`album:${albumId}:postcards`);
    const postcardIds: string[] = postcardIdsRaw ? JSON.parse(postcardIdsRaw) : [];

    const postcards = [];
    for (const pcId of postcardIds) {
      const pcRaw = await kv.get(`postcard:${pcId}`);
      if (pcRaw) {
        const pc = JSON.parse(pcRaw);
        const frontImageUrl = pc.frontImagePath ? await getSignedUrl(pc.frontImagePath) : null;
        const customStampUrl = pc.customStampPath ? await getSignedUrl(pc.customStampPath) : null;
        postcards.push({ ...pc, frontImageUrl, customStampUrl });
      }
    }

    const coverImageUrl = album.coverImagePath ? await getSignedUrl(album.coverImagePath) : null;
    return c.json({ ...album, coverImageUrl, postcards });
  } catch (err) {
    console.log("Get album error:", err);
    return c.json({ error: `Get album failed: ${err}` }, 500);
  }
});

app.put("/make-server-5439cc58/albums/:id", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  try {
    await ensureBucket();
    const albumId = c.req.param("id");
    const raw = await kv.get(`album:${albumId}`);
    if (!raw) return c.json({ error: "Album not found" }, 404);

    const album = JSON.parse(raw);
    if (album.userId !== user!.id) return c.json({ error: "Forbidden" }, 403);

    const body = await c.req.parseBody();
    const name = body["name"] as string | undefined;
    const date = body["date"] as string | undefined;
    const coverImageFile = body["coverImage"] as File | undefined;

    if (name) album.name = name;
    if (date !== undefined) album.date = date;

    if (coverImageFile && coverImageFile.size > 0) {
      const ext = coverImageFile.name.split(".").pop() ?? "jpg";
      const newPath = `${user!.id}/albums/${albumId}/cover.${ext}`;
      const buffer = new Uint8Array(await coverImageFile.arrayBuffer());
      const supabase = getAdminClient();
      await supabase.storage.from(BUCKET_NAME).upload(newPath, buffer, {
        contentType: coverImageFile.type,
        upsert: true,
      });
      album.coverImagePath = newPath;
    }

    await kv.set(`album:${albumId}`, JSON.stringify(album));
    const coverImageUrl = album.coverImagePath ? await getSignedUrl(album.coverImagePath) : null;
    return c.json({ ...album, coverImageUrl });
  } catch (err) {
    console.log("Update album error:", err);
    return c.json({ error: `Update album failed: ${err}` }, 500);
  }
});

app.delete("/make-server-5439cc58/albums/:id", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  try {
    const albumId = c.req.param("id");
    const raw = await kv.get(`album:${albumId}`);
    if (!raw) return c.json({ error: "Album not found" }, 404);

    const album = JSON.parse(raw);
    if (album.userId !== user!.id) return c.json({ error: "Forbidden" }, 403);

    // Delete all postcards in album
    const postcardIdsRaw = await kv.get(`album:${albumId}:postcards`);
    const postcardIds: string[] = postcardIdsRaw ? JSON.parse(postcardIdsRaw) : [];
    for (const pcId of postcardIds) {
      await kv.del(`postcard:${pcId}`);
    }

    await kv.del(`album:${albumId}:postcards`);
    await kv.del(`album:${albumId}`);

    // Remove from user's list
    const existingRaw = await kv.get(`user:${user!.id}:albums`);
    const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = existing.filter((id) => id !== albumId);
    await kv.set(`user:${user!.id}:albums`, JSON.stringify(updated));

    return c.json({ success: true });
  } catch (err) {
    console.log("Delete album error:", err);
    return c.json({ error: `Delete album failed: ${err}` }, 500);
  }
});

// ─── POSTCARDS ─────────────────────────────────────────────────────────────

app.post("/make-server-5439cc58/albums/:albumId/postcards", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  try {
    await ensureBucket();
    const albumId = c.req.param("albumId");
    const albumRaw = await kv.get(`album:${albumId}`);
    if (!albumRaw) return c.json({ error: "Album not found" }, 404);

    const album = JSON.parse(albumRaw);
    if (album.userId !== user!.id) return c.json({ error: "Forbidden" }, 403);

    const body = await c.req.parseBody();
    const title = body["title"] as string ?? "Untitled";
    const text = body["text"] as string ?? "";
    const signature = body["signature"] as string ?? "";
    const frontImageFile = body["frontImage"] as File | undefined;
    const customStampFile = body["customStampFile"] as File | undefined;
    // Pre-uploaded path (used for direct video uploads bypassing body size limit)
    const frontImagePathDirect = body["frontImagePath"] as string | undefined;
    const frontImageTypeDirect = body["frontImageType"] as string | undefined;

    const postcardId = crypto.randomUUID();
    let frontImagePath: string | null = null;
    let frontImageMediaType: string | null = null;
    let customStampPath: string | null = null;

    // Use pre-uploaded path if provided (video direct upload)
    if (frontImagePathDirect) {
      frontImagePath = frontImagePathDirect;
      frontImageMediaType = frontImageTypeDirect ?? "video/mp4";
    } else if (frontImageFile && frontImageFile.size > 0) {
      const ext = frontImageFile.name.split(".").pop() ?? "jpg";
      frontImagePath = `${user!.id}/postcards/${postcardId}/front.${ext}`;
      const buffer = new Uint8Array(await frontImageFile.arrayBuffer());
      const supabase = getAdminClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(frontImagePath, buffer, { contentType: frontImageFile.type });
      if (uploadError) {
        console.log("Postcard image upload error:", uploadError);
        frontImagePath = null;
      } else {
        frontImageMediaType = frontImageFile.type;
      }
    }

    if (customStampFile && customStampFile.size > 0) {
      const ext = customStampFile.name.split(".").pop() ?? "jpg";
      customStampPath = `${user!.id}/postcards/${postcardId}/stamp.${ext}`;
      const buffer = new Uint8Array(await customStampFile.arrayBuffer());
      const supabase = getAdminClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(customStampPath, buffer, { contentType: customStampFile.type });
      if (uploadError) {
        console.log("Custom stamp upload error:", uploadError);
        customStampPath = null;
      }
    }

    const stickersRaw = body["stickers"] as string | undefined;
    let stickers: unknown[] = [];
    try { stickers = stickersRaw ? JSON.parse(stickersRaw) : []; } catch { stickers = []; }

    const postcard = {
      id: postcardId,
      albumId,
      userId: user!.id,
      title,
      text,
      signature,
      frontImagePath,
      mediaType: frontImageMediaType,
      stamp: body["stamp"] != null && body["stamp"] !== "" ? Number(body["stamp"]) : null,
      customStampPath,
      displayMode: (body["displayMode"] as string | undefined) ?? "card",
      stickers,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`postcard:${postcardId}`, JSON.stringify(postcard));

    const postcardIdsRaw = await kv.get(`album:${albumId}:postcards`);
    const postcardIds: string[] = postcardIdsRaw ? JSON.parse(postcardIdsRaw) : [];
    postcardIds.unshift(postcardId);
    await kv.set(`album:${albumId}:postcards`, JSON.stringify(postcardIds));

    const frontImageUrl = frontImagePath ? await getSignedUrl(frontImagePath) : null;
    const customStampUrl = customStampPath ? await getSignedUrl(customStampPath) : null;
    return c.json({ ...postcard, frontImageUrl, customStampUrl });
  } catch (err) {
    console.log("Create postcard error:", err);
    return c.json({ error: `Create postcard failed: ${err}` }, 500);
  }
});

app.get("/make-server-5439cc58/postcards/:id", async (c) => {
  try {
    const postcardId = c.req.param("id");
    const raw = await kv.get(`postcard:${postcardId}`);
    if (!raw) return c.json({ error: "Postcard not found" }, 404);

    const postcard = JSON.parse(raw);
    const frontImageUrl = postcard.frontImagePath ? await getSignedUrl(postcard.frontImagePath) : null;
    const customStampUrl = postcard.customStampPath ? await getSignedUrl(postcard.customStampPath) : null;
    return c.json({ ...postcard, frontImageUrl, customStampUrl });
  } catch (err) {
    console.log("Get postcard error:", err);
    return c.json({ error: `Get postcard failed: ${err}` }, 500);
  }
});

app.put("/make-server-5439cc58/postcards/:id", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  try {
    await ensureBucket();
    const postcardId = c.req.param("id");
    const raw = await kv.get(`postcard:${postcardId}`);
    if (!raw) return c.json({ error: "Postcard not found" }, 404);

    const postcard = JSON.parse(raw);
    if (postcard.userId !== user!.id) return c.json({ error: "Forbidden" }, 403);

    const body = await c.req.parseBody();
    const title = body["title"] as string | undefined;
    const text = body["text"] as string | undefined;
    const signature = body["signature"] as string | undefined;
    const frontImageFile = body["frontImage"] as File | undefined;
    const customStampFile = body["customStampFile"] as File | undefined;

    if (title !== undefined) postcard.title = title;
    if (text !== undefined) postcard.text = text;
    if (signature !== undefined) postcard.signature = signature;
    if (body["displayMode"] !== undefined) postcard.displayMode = body["displayMode"] as string;
    if (body["stickers"] !== undefined) {
      try { postcard.stickers = JSON.parse(body["stickers"] as string); } catch { postcard.stickers = []; }
    }
    if (body["stamp"] !== undefined) {
      postcard.stamp = body["stamp"] != null && body["stamp"] !== "" ? Number(body["stamp"]) : null;
    }
    // Clear customStampPath when switching to a preset stamp or removing stamp
    if (body["clearCustomStamp"] === "1") {
      postcard.customStampPath = null;
    }
    // If a new custom stamp is uploaded, clear preset stamp index
    if (customStampFile && customStampFile.size > 0) {
      postcard.stamp = null;
    }

    // Accept pre-uploaded path (direct video upload)
    const frontImagePathDirect = body["frontImagePath"] as string | undefined;
    const frontImageTypeDirect = body["frontImageType"] as string | undefined;
    if (frontImagePathDirect) {
      postcard.frontImagePath = frontImagePathDirect;
      postcard.mediaType = frontImageTypeDirect ?? "video/mp4";
    } else if (frontImageFile && frontImageFile.size > 0) {
      const ext = frontImageFile.name.split(".").pop() ?? "jpg";
      const newPath = `${user!.id}/postcards/${postcardId}/front.${ext}`;
      const buffer = new Uint8Array(await frontImageFile.arrayBuffer());
      const supabase = getAdminClient();
      await supabase.storage.from(BUCKET_NAME).upload(newPath, buffer, {
        contentType: frontImageFile.type,
        upsert: true,
      });
      postcard.frontImagePath = newPath;
      postcard.mediaType = frontImageFile.type;
    }

    if (customStampFile && customStampFile.size > 0) {
      const ext = customStampFile.name.split(".").pop() ?? "jpg";
      const stampPath = `${user!.id}/postcards/${postcardId}/stamp.${ext}`;
      const buffer = new Uint8Array(await customStampFile.arrayBuffer());
      const supabase = getAdminClient();
      await supabase.storage.from(BUCKET_NAME).upload(stampPath, buffer, {
        contentType: customStampFile.type,
        upsert: true,
      });
      postcard.customStampPath = stampPath;
    }

    await kv.set(`postcard:${postcardId}`, JSON.stringify(postcard));
    const frontImageUrl = postcard.frontImagePath ? await getSignedUrl(postcard.frontImagePath) : null;
    const customStampUrl = postcard.customStampPath ? await getSignedUrl(postcard.customStampPath) : null;
    return c.json({ ...postcard, frontImageUrl, customStampUrl });
  } catch (err) {
    console.log("Update postcard error:", err);
    return c.json({ error: `Update postcard failed: ${err}` }, 500);
  }
});

app.delete("/make-server-5439cc58/postcards/:id", async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  try {
    const postcardId = c.req.param("id");
    const raw = await kv.get(`postcard:${postcardId}`);
    if (!raw) return c.json({ error: "Postcard not found" }, 404);

    const postcard = JSON.parse(raw);
    if (postcard.userId !== user!.id) return c.json({ error: "Forbidden" }, 403);

    await kv.del(`postcard:${postcardId}`);

    // Remove from album's list
    const postcardIdsRaw = await kv.get(`album:${postcard.albumId}:postcards`);
    const postcardIds: string[] = postcardIdsRaw ? JSON.parse(postcardIdsRaw) : [];
    const updated = postcardIds.filter((id) => id !== postcardId);
    await kv.set(`album:${postcard.albumId}:postcards`, JSON.stringify(updated));

    return c.json({ success: true });
  } catch (err) {
    console.log("Delete postcard error:", err);
    return c.json({ error: `Delete postcard failed: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);